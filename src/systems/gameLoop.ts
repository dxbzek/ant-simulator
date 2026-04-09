import { useWorldStore } from '../stores/worldStore'
import { useCraftingStore } from '../stores/craftingStore'
import { useResearchStore, _setColonyResearchSpeed, _setOnResearchComplete } from '../stores/researchStore'
import { useQuestStore } from '../stores/questStore'
import { usePlayerStore, _setResearchRefs, _setColonyDefenseBonus, _setColonySpeedBonus } from '../stores/playerStore'
import { useColonyStore } from '../stores/colonyStore'
import { useInventoryStore, type ResourceType, _setStorageLimitsRef } from '../stores/inventoryStore'
import { useGameStore, useGameLogStore } from '../stores/gameStore'
import { _setQualityBonus } from '../data/resources'
import { useDiplomacyStore } from '../stores/diplomacyStore'
import { useCombatStore } from '../stores/combatStore'
import { FACTIONS } from '../data/factions'
import { INITIAL_QUESTS } from '../data/quests'
import { BUILDINGS } from '../data/buildings'
import { RESEARCH_NODES } from '../data/research'
import { EQUIPMENT as EQUIP_DATA } from '../data/equipment'
import { fbm2D } from '../utils/noise'
import { getTerrainHeightAt } from '../components/world/Terrain'

let worldEventTimer = 120 // seconds until first event
let buildingEffectTimer = 0
const visitedBiomes = new Set<string>()

export function getVisitedBiomes(): Set<string> { return visitedBiomes }
export function restoreVisitedBiomes(biomes: string[]) {
  visitedBiomes.clear()
  biomes.forEach(b => visitedBiomes.add(b))
}
export function getWorldEventTimer(): number { return worldEventTimer }
export function restoreWorldEventTimer(t: number) { worldEventTimer = t }

export function initGame() {
  // Reset module-level state so re-starting the game works correctly
  worldEventTimer = 120
  buildingEffectTimer = 0
  visitedBiomes.clear()
  visitedBiomes.add('forest')

  // Wire refs (idempotent)
  _setResearchRefs(useResearchStore, RESEARCH_NODES)
  _setStorageLimitsRef(storageLimits)
  _setOnResearchComplete((nodeId) => {
    useQuestStore.getState().updateQuestsByType('research', nodeId, 1)
  })

  // Reset all stores to initial state for a fresh game.
  // loadGame() runs after this and overwrites these values for CONTINUE.
  usePlayerStore.setState({
    positionX: 0, positionY: 0.5, positionZ: 0,
    velocityX: 0, velocityY: 0, velocityZ: 0,
    hp: 100, maxHp: 100, stamina: 100, maxStamina: 100,
    level: 1, xp: 0, xpToNext: 100, skillPoints: 0,
    skills: { attack: 0, defense: 0, speed: 0, health: 0 },
    role: 'worker',
    equipment: { weapon: null, armor: null, accessory: null, helmet: null },
    activeBuffs: [], baseAttack: 10, baseDefense: 5, baseSpeed: 5, isDead: false,
  })
  useInventoryStore.setState({
    resources: { food: 0, wood: 0, leaves: 0, minerals: 0, water: 0 },
    items: [], hotbar: [null, null, null, null, null], selectedHotbarSlot: 0,
  })
  useColonyStore.setState({ buildings: [], population: 5, maxPopulation: 10, armySize: 0 })
  useResearchStore.setState({ completed: [], currentResearch: null, progress: 0 })
  useCraftingStore.setState({ queue: [] })
  useCombatStore.getState().clearAll()
  const initialRelations: Record<string, number> = {}
  FACTIONS.forEach((f) => { initialRelations[f.id] = f.baseRelation })
  useDiplomacyStore.setState({ relations: initialRelations, atWar: [] })
  useWorldStore.setState({
    worldTime: 60, dayProgress: 0.25, timeOfDay: 'day', dayCount: 1,
    weather: 'clear', weatherTimer: 60, weatherIntensity: 0,
    currentBiome: 'forest', worldEvent: 'none', eventTimer: 0,
  })
  useGameStore.setState({ gameTime: 0, tutorialComplete: false, tutorialStep: 'welcome' })
  useGameLogStore.getState().clear()

  // Add starting quests
  useQuestStore.setState({ activeQuests: [], completedQuests: [] })
  INITIAL_QUESTS.forEach((q) => useQuestStore.getState().addQuest({ ...q }))

  useGameLogStore.getState().addMessage('Welcome to Ant Colony Simulator!', 'system')
  useGameLogStore.getState().addMessage('Use WASD to move, E to gather, B to build.', 'system')
}

export function tickGameLoop(dt: number) {
  const screen = useGameStore.getState().screen
  if (screen !== 'playing') return

  // Tick game time
  useGameStore.getState().tickGameTime(dt)

  // Crafting queue
  useCraftingStore.getState().tick(dt)

  // Research
  useResearchStore.getState().tick(dt)

  // Check quest completion
  checkQuests()

  // World events
  tickWorldEvents(dt)

  // Update biome based on player position
  updatePlayerBiome()

  // Apply building effects every 2 seconds
  buildingEffectTimer += dt
  if (buildingEffectTimer >= 2) {
    buildingEffectTimer = 0
    applyBuildingEffects()
  }
}

function checkQuests() {
  const quests = useQuestStore.getState().activeQuests
  const player = usePlayerStore.getState()
  const colony = useColonyStore.getState()

  for (const quest of quests) {
    if (quest.completed) continue

    // Update level-based quests — set progress to actual level, capped at target
    // to avoid infinite setProgress calls once level exceeds quest target
    if (quest.objective === 'reachLevel') {
      const capped = Math.min(player.level, quest.target)
      if (capped !== quest.progress) {
        useQuestStore.getState().setProgress(quest.id, capped)
      }
    }

    // Check completion — re-read progress from store in case setProgress just ran
    const currentProgress = quest.objective === 'reachLevel'
      ? Math.min(player.level, quest.target)
      : quest.progress
    if (currentProgress >= quest.target) {
      const completed = useQuestStore.getState().completeQuest(quest.id)
      if (completed) {
        if (completed.rewards.xp) {
          usePlayerStore.getState().addXp(completed.rewards.xp)
        }
        // Distribute resource rewards
        if (completed.rewards.resources) {
          for (const [type, amount] of Object.entries(completed.rewards.resources)) {
            if (amount && amount > 0) {
              useInventoryStore.getState().addResource(type as ResourceType, amount)
            }
          }
        }
        // Distribute item rewards
        if (completed.rewards.item) {
          const equip = EQUIP_DATA.find((e) => e.id === completed.rewards.item)
          if (equip) {
            useInventoryStore.getState().addItem({
              id: `${equip.id}-${Date.now()}`,
              name: equip.name, type: equip.type, rarity: equip.rarity,
              icon: equip.icon, stats: equip.stats, description: equip.description,
            })
            useGameLogStore.getState().addMessage(`Quest reward: ${equip.name}!`, 'loot')
          }
        }
        useGameLogStore.getState().addMessage(
          `Quest completed: ${completed.name}! +${completed.rewards.xp || 0} XP`,
          'quest'
        )
      }
    }
  }
}

const WORLD_EVENTS = ['migration', 'resourceBloom', 'invasion', 'plague', 'goldenAge'] as const

// Track active event effects so systems can read them
export const activeEventEffects = {
  spawnRateMultiplier: 1,
  enemyStatMultiplier: 1,
  staminaDrainMultiplier: 1,
  xpMultiplier: 1,
  gatherMultiplier: 1,
}

function updateEventEffects() {
  const world = useWorldStore.getState()
  const event = world.worldEvent
  const weather = world.weather

  activeEventEffects.spawnRateMultiplier = event === 'migration' ? 2 : event === 'invasion' ? 1.5 : 1
  activeEventEffects.enemyStatMultiplier = event === 'invasion' ? 1.3 : 1
  activeEventEffects.staminaDrainMultiplier = event === 'plague' ? 1.5 : 1
  activeEventEffects.xpMultiplier = event === 'goldenAge' ? 1.5 : 1

  // Gather multiplier: events + weather
  let gatherMult = event === 'resourceBloom' ? 2 : 1
  if (weather === 'storm') gatherMult *= 0.7       // storms slow gathering by 30%
  else if (weather === 'rain') gatherMult *= 0.85   // rain slows gathering by 15%
  activeEventEffects.gatherMultiplier = gatherMult
}

function tickWorldEvents(dt: number) {
  // Update effects every frame
  updateEventEffects()

  worldEventTimer -= dt
  if (worldEventTimer <= 0) {
    worldEventTimer = 120 + Math.random() * 180
    const event = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)]
    const duration = 30 + Math.random() * 30
    useWorldStore.getState().setWorldEvent(event, duration)

    const eventMessages: Record<string, string> = {
      migration: 'Migration! 2x enemy spawn rate for 30s.',
      resourceBloom: 'Resource Bloom! 2x gathering yield!',
      invasion: 'Invasion! Enemies +30% stronger!',
      plague: 'Plague! Stamina drains 50% faster.',
      goldenAge: 'Golden Age! +50% XP from all sources!',
    }
    useGameLogStore.getState().addMessage(`World Event: ${eventMessages[event] || event}`, 'system')

    if (event === 'invasion') {
      // Factions at war or with very negative relations launch raids
      const diplomacy = useDiplomacyStore.getState()
      const player = usePlayerStore.getState()
      for (const faction of FACTIONS) {
        const relation = diplomacy.relations[faction.id] || 0
        const isAtWar = diplomacy.atWar.includes(faction.id)
        if (isAtWar || relation < -40) {
          // Spawn faction raiders near the player
          const count = isAtWar ? 3 : 1
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const dist = 10 + Math.random() * 10
            const x = player.positionX + Math.cos(angle) * dist
            const z = player.positionZ + Math.sin(angle) * dist
            const y = getTerrainHeightAt(x, z)
            const levelScale = 1 + player.level * 0.1
            useCombatStore.getState().addEnemy({
              id: `raid-${faction.id}-${Date.now()}-${i}`,
              type: 'ant_archer',
              x, y: y + 0.05, z,
              hp: Math.ceil(35 * levelScale),
              maxHp: Math.ceil(35 * levelScale),
              attack: Math.ceil(12 * levelScale),
              defense: Math.ceil(4 * levelScale),
              speed: 4,
              aggroRange: 20,
              isAggro: true,
              isBoss: false,
              attackPattern: 'melee',
              lastAttackTime: 0,
              attackCooldown: 1.5,
              lootTable: 'ant_archer',
            })
          }
          useGameLogStore.getState().addMessage(`${faction.name} raiders attack!`, 'combat')
          // Worsen relations from invasion
          diplomacy.changeRelation(faction.id, -10)
        }
      }
    }
    if (event === 'resourceBloom') {
      useInventoryStore.getState().addResource('food', 10)
      useInventoryStore.getState().addResource('leaves', 8)
      useInventoryStore.getState().addResource('water', 5)
    }
    if (event === 'goldenAge') {
      usePlayerStore.getState().addXp(50)
    }
  }
}

function updatePlayerBiome() {
  const px = usePlayerStore.getState().positionX
  const pz = usePlayerStore.getState().positionZ
  const biomeNoise = fbm2D(px * 0.005, pz * 0.005, 3, 2, 0.5)

  let biome: 'forest' | 'garden' | 'cave' | 'desert' | 'swamp'
  if (biomeNoise < -0.3) biome = 'desert'
  else if (biomeNoise < -0.05) biome = 'swamp'
  else if (biomeNoise < 0.2) biome = 'forest'
  else if (biomeNoise < 0.45) biome = 'garden'
  else biome = 'cave'

  const current = useWorldStore.getState().currentBiome
  if (biome !== current) {
    useWorldStore.getState().setBiome(biome)

    // Track biome exploration for quests
    if (!visitedBiomes.has(biome)) {
      visitedBiomes.add(biome)
      useQuestStore.getState().updateQuestsByType('explore', 'biome', 1)
      useGameLogStore.getState().addMessage(`Discovered new biome: ${biome}!`, 'system')
    }
  }
}

// Research-driven bonus: extra max build levels
export let researchMaxBuildLevel = 0

// Track colony bonuses from population and buildings
export const colonyBonuses = {
  gatherBonus: 0,       // % bonus to gathering
  defenseBonus: 0,      // flat defense added
  researchSpeed: 0,     // bonus research speed multiplier
  detectionRange: 0,    // bonus detection range
  speedBonus: 0,        // % bonus to movement speed from buildings
  allBonus: 0,          // queen chamber global multiplier
}

// Storage limits based on buildings
export const storageLimits = {
  food: 200,       // base storage
  wood: 200,
  leaves: 200,
  minerals: 200,
  water: 200,
}

function applyBuildingEffects() {
  const colony = useColonyStore.getState()
  const buildings = colony.buildings.filter(b => b.isComplete)
  let totalPopCap = 10 // base
  let totalArmy = 0

  for (const building of buildings) {
    const def = BUILDINGS.find(b => b.id === building.type)
    if (!def) continue
    const level = building.level
    if (def.effects.populationCap) totalPopCap += def.effects.populationCap * level
    if (def.effects.armySize) totalArmy += def.effects.armySize * level
  }

  // Calculate storage limits from buildings
  storageLimits.food = 200
  storageLimits.wood = 200
  storageLimits.leaves = 200
  storageLimits.minerals = 200
  storageLimits.water = 200

  for (const building of buildings) {
    const def = BUILDINGS.find(b => b.id === building.type)
    if (!def) continue
    const level = building.level
    if (def.effects.foodStorage) storageLimits.food += def.effects.foodStorage * level
    if (def.effects.woodStorage) storageLimits.wood += def.effects.woodStorage * level
    if (def.effects.mineralStorage) storageLimits.minerals += def.effects.mineralStorage * level
    if (def.effects.leavesStorage) storageLimits.leaves += def.effects.leavesStorage * level
    if (def.effects.waterStorage) storageLimits.water += def.effects.waterStorage * level
  }

  // Calculate building-specific bonuses
  let researchSpeed = 0
  let detectionRange = 0
  let allBonus = 0
  let speedBonus = 0

  for (const building of buildings) {
    const def = BUILDINGS.find(b => b.id === building.type)
    if (!def) continue
    const level = building.level
    if (def.effects.researchSpeed) researchSpeed += def.effects.researchSpeed * level
    if (def.effects.detectionRange) detectionRange += def.effects.detectionRange * level
    if (def.effects.allBonus) allBonus += def.effects.allBonus * level
    if (def.effects.speedBonus) speedBonus += def.effects.speedBonus * level
  }

  // Apply allBonus as global multiplier
  const globalMult = 1 + allBonus

  colony.setMaxPopulation(totalPopCap)
  colony.setArmySize(totalArmy)

  // Export colony bonuses and update research speed
  colonyBonuses.researchSpeed = researchSpeed * globalMult
  _setColonyResearchSpeed(colonyBonuses.researchSpeed)
  colonyBonuses.detectionRange = detectionRange * globalMult
  colonyBonuses.speedBonus = speedBonus * globalMult
  _setColonySpeedBonus(colonyBonuses.speedBonus)
  colonyBonuses.allBonus = allBonus

  // Population grows slowly toward cap (1 ant per 10 seconds = 0.2 per 2s tick)
  if (colony.population < colony.maxPopulation) {
    colony.setPopulation(Math.min(colony.maxPopulation, colony.population + 0.2))
  }

  // Population generates passive resources (workers gather)
  const pop = Math.floor(colony.population)
  if (pop > 0) {
    const inv = useInventoryStore.getState()
    const passiveGather = pop * 0.05 // each ant gathers 0.05 per 2s tick
    inv.addResource('food', passiveGather * 0.4)
    inv.addResource('leaves', passiveGather * 0.3)
    inv.addResource('wood', passiveGather * 0.2)
    inv.addResource('water', passiveGather * 0.1)
  }

  // Army provides defense bonus, population provides gather bonus (scaled by queen's allBonus)
  colonyBonuses.defenseBonus = totalArmy * 0.5 * globalMult
  _setColonyDefenseBonus(colonyBonuses.defenseBonus)
  colonyBonuses.gatherBonus = Math.floor(colony.population) * 0.01 * globalMult // 1% per ant

  // Wire research effects: qualityBonus, maxBuildLevel, carryBonus
  const completed = useResearchStore.getState().completed
  let qBonus = 0
  let mbl = 0
  let carryBonus = 0
  for (const nodeId of completed) {
    const node = RESEARCH_NODES.find(n => n.id === nodeId)
    if (!node) continue
    if (node.effect.startsWith('qualityBonus:')) qBonus += parseFloat(node.effect.split(':')[1]) || 0
    if (node.effect.startsWith('maxBuildLevel:')) mbl += parseFloat(node.effect.split(':')[1]) || 0
    if (node.effect.startsWith('carryBonus:')) carryBonus += parseFloat(node.effect.split(':')[1]) || 0
  }
  _setQualityBonus(qBonus)
  researchMaxBuildLevel = mbl

  // Apply carryBonus as a percentage increase to all storage limits
  if (carryBonus > 0) {
    const mult = 1 + carryBonus
    storageLimits.food = Math.floor(storageLimits.food * mult)
    storageLimits.wood = Math.floor(storageLimits.wood * mult)
    storageLimits.leaves = Math.floor(storageLimits.leaves * mult)
    storageLimits.minerals = Math.floor(storageLimits.minerals * mult)
    storageLimits.water = Math.floor(storageLimits.water * mult)
  }
}
