import { useWorldStore } from '../stores/worldStore'
import { useCraftingStore } from '../stores/craftingStore'
import { useResearchStore } from '../stores/researchStore'
import { useQuestStore } from '../stores/questStore'
import { usePlayerStore, _setResearchRefs } from '../stores/playerStore'
import { useColonyStore } from '../stores/colonyStore'
import { useInventoryStore, type ResourceType } from '../stores/inventoryStore'
import { useGameStore, useGameLogStore } from '../stores/gameStore'
import { INITIAL_QUESTS } from '../data/quests'
import { BUILDINGS } from '../data/buildings'
import { RESEARCH_NODES } from '../data/research'
import { EQUIPMENT as EQUIP_DATA } from '../data/equipment'
import { fbm2D } from '../utils/noise'

let initialized = false
let worldEventTimer = 120 // seconds until first event
let buildingEffectTimer = 0
const visitedBiomes = new Set<string>()

export function initGame() {
  if (initialized) return
  initialized = true

  // Wire research refs for playerStore to read bonuses
  _setResearchRefs(useResearchStore, RESEARCH_NODES)

  // Add initial quests
  const questStore = useQuestStore.getState()
  if (questStore.activeQuests.length === 0) {
    INITIAL_QUESTS.forEach((q) => questStore.addQuest({ ...q }))
  }

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

    // Update level-based quests
    if (quest.objective === 'reachLevel') {
      if (player.level > quest.progress) {
        useQuestStore.getState().updateProgress(quest.id, player.level - quest.progress)
      }
    }

    // Check completion
    if (quest.progress >= quest.target) {
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
  const event = useWorldStore.getState().worldEvent
  activeEventEffects.spawnRateMultiplier = event === 'migration' ? 2 : event === 'invasion' ? 1.5 : 1
  activeEventEffects.enemyStatMultiplier = event === 'invasion' ? 1.3 : 1
  activeEventEffects.staminaDrainMultiplier = event === 'plague' ? 1.5 : 1
  activeEventEffects.xpMultiplier = event === 'goldenAge' ? 1.5 : 1
  activeEventEffects.gatherMultiplier = event === 'resourceBloom' ? 2 : 1
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

function applyBuildingEffects() {
  const buildings = useColonyStore.getState().buildings.filter(b => b.isComplete)
  let totalPopCap = 10 // base
  let totalArmy = 0

  for (const building of buildings) {
    const def = BUILDINGS.find(b => b.id === building.type)
    if (!def) continue
    const level = building.level
    if (def.effects.populationCap) totalPopCap += def.effects.populationCap * level
    if (def.effects.armySize) totalArmy += def.effects.armySize * level
  }

  useColonyStore.getState().setMaxPopulation(totalPopCap)
  useColonyStore.getState().setArmySize(totalArmy)
}
