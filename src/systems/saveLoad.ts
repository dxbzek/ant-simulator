import { usePlayerStore } from '../stores/playerStore'
import { useInventoryStore } from '../stores/inventoryStore'
import { useWorldStore } from '../stores/worldStore'
import { useColonyStore } from '../stores/colonyStore'
import { useQuestStore } from '../stores/questStore'
import { useResearchStore } from '../stores/researchStore'
import { useDiplomacyStore } from '../stores/diplomacyStore'
import { useCombatStore } from '../stores/combatStore'
import { useCraftingStore } from '../stores/craftingStore'
import { useGameStore, useGameLogStore } from '../stores/gameStore'
import { resetBossAlive } from '../components/entities/EnemyManager'
import { getVisitedBiomes, restoreVisitedBiomes, getWorldEventTimer, restoreWorldEventTimer } from './gameLoop'
import { EQUIPMENT } from '../data/equipment'

const EQUIPMENT_BY_ID = new Map(EQUIPMENT.map(e => [e.id, e]))
const VALID_BUFF_STATS = new Set(['attack', 'defense', 'speed'])
const MAX_BUFF_DURATION_SEC = 3600

const SAVE_KEY = 'ant-sim-save'
const CURRENT_SCHEMA_VERSION = 2

// Fill in any fields added in later schema versions with safe defaults so the
// rest of loadGame can trust a full v2 shape.
function migrateV1ToV2(data: any): void {
  data.inventory.hotbar ??= [null, null, null, null, null, null, null, null, null]
  data.inventory.selectedHotbarSlot ??= 0
  data.world.weatherTimer ??= 0
  // worldStore exposes this as `worldEvent`; the save schema historically
  // wrote it under `currentEvent`, so keep reading from that key.
  if (!data.world.currentEvent) data.world.currentEvent = 'none'
  data.world.eventTimer ??= 0
  data.player.activeBuffs ??= []
  data.crafting ??= { queue: [] }
  data.version = 2
}

function migrateSaveData(data: any): boolean {
  if (data.version === 1) migrateV1ToV2(data)
  return data.version === CURRENT_SCHEMA_VERSION
}

interface SaveData {
  version: 2
  timestamp: number
  visitedBiomes?: string[]
  worldEventTimer?: number
  tutorialStep?: string | null
  player: {
    positionX: number; positionY: number; positionZ: number
    hp: number; maxHp: number; stamina: number; maxStamina: number
    level: number; xp: number; xpToNext: number
    skillPoints: number; skills: any
    role: string; equipment: any
    baseAttack: number; baseDefense: number; baseSpeed: number
    activeBuffs?: any[]
  }
  inventory: {
    resources: any
    items: any[]
    hotbar: any[]
    selectedHotbarSlot: number
  }
  world: {
    worldTime: number; dayCount: number
    weather: string; weatherIntensity: number; weatherTimer?: number
    currentEvent: string; eventTimer: number
  }
  colony: {
    buildings: any[]
    population: number; maxPopulation: number; armySize: number
  }
  quests: {
    activeQuests: any[]
    completedQuests: string[]
  }
  research: {
    completed: string[]
    current: string | null
    progress: number
  }
  diplomacy: {
    relations: Record<string, number>
    atWar: string[]
  }
  crafting?: {
    queue: any[]
  }
  gameTime: number
  tutorialComplete?: boolean
}

export function saveGame(): boolean {
  try {
    const game = useGameStore.getState()
    game.setSaving(true)

    const player = usePlayerStore.getState()
    const inventory = useInventoryStore.getState()
    const world = useWorldStore.getState()
    const colony = useColonyStore.getState()
    const quests = useQuestStore.getState()
    const research = useResearchStore.getState()
    const diplomacy = useDiplomacyStore.getState()

    const data: SaveData = {
      version: 2,
      timestamp: Date.now(),
      visitedBiomes: Array.from(getVisitedBiomes()),
      worldEventTimer: getWorldEventTimer(),
      tutorialStep: game.tutorialStep,
      player: {
        positionX: player.positionX, positionY: player.positionY, positionZ: player.positionZ,
        hp: player.hp, maxHp: player.maxHp, stamina: player.stamina, maxStamina: player.maxStamina,
        level: player.level, xp: player.xp, xpToNext: player.xpToNext,
        skillPoints: player.skillPoints, skills: player.skills,
        role: player.role, equipment: player.equipment,
        baseAttack: player.baseAttack, baseDefense: player.baseDefense, baseSpeed: player.baseSpeed,
        activeBuffs: player.activeBuffs,
      },
      inventory: {
        resources: inventory.resources,
        items: inventory.items,
        hotbar: inventory.hotbar,
        selectedHotbarSlot: inventory.selectedHotbarSlot,
      },
      world: {
        worldTime: world.worldTime, dayCount: world.dayCount,
        weather: world.weather, weatherIntensity: world.weatherIntensity,
        weatherTimer: world.weatherTimer,
        currentEvent: world.worldEvent || '', eventTimer: world.eventTimer || 0,
      },
      colony: {
        buildings: colony.buildings,
        population: colony.population, maxPopulation: colony.maxPopulation, armySize: colony.armySize,
      },
      quests: {
        activeQuests: quests.activeQuests,
        completedQuests: quests.completedQuests,
      },
      research: {
        completed: research.completed,
        current: research.currentResearch || null,
        progress: research.progress || 0,
      },
      diplomacy: {
        relations: diplomacy.relations,
        atWar: diplomacy.atWar,
      },
      crafting: {
        queue: useCraftingStore.getState().queue,
      },
      gameTime: game.gameTime,
      tutorialComplete: game.tutorialComplete,
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    useGameLogStore.getState().addMessage('Game saved!', 'system')
    game.setSaving(false)
    return true
  } catch (e) {
    console.error('Save failed:', e)
    useGameLogStore.getState().addMessage('Failed to save game!', 'system')
    useGameStore.getState().setSaving(false)
    return false
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function equipmentHpBonus(equipment: any): number {
  if (!equipment) return 0
  let bonus = 0
  for (const slot of Object.values(equipment) as (string | null)[]) {
    if (!slot) continue
    const equip = EQUIPMENT_BY_ID.get(slot.replace(/-\d+$/, ''))
    if (equip?.stats?.hp) bonus += equip.stats.hp
  }
  return bonus
}

function sanitizeSaveData(data: any): void {
  const p = data.player
  if (p) {
    p.level = clamp(Math.floor(p.level ?? 1), 1, 100)
    p.maxHp = clamp(p.maxHp ?? 100, 100, 10000)
    // hp may legitimately exceed maxHp due to equipment hp bonus
    const effectiveMax = p.maxHp + equipmentHpBonus(p.equipment)
    // clamp to min 1 so a saved 0-hp value doesn't load as a living-corpse
    p.hp = clamp(p.hp ?? p.maxHp, 1, effectiveMax)
    p.maxStamina = clamp(p.maxStamina ?? 100, 100, 5000)
    p.stamina = clamp(p.stamina ?? p.maxStamina, 0, p.maxStamina)
    p.xp = Math.max(0, p.xp ?? 0)
    p.skillPoints = Math.max(0, Math.floor(p.skillPoints ?? 0))
    if (p.skills) {
      for (const k of ['attack', 'defense', 'speed', 'health'] as const) {
        p.skills[k] = Math.max(0, Math.floor(p.skills[k] ?? 0))
      }
    }
    p.baseAttack = Math.max(1, p.baseAttack ?? 10)
    p.baseDefense = Math.max(0, p.baseDefense ?? 5)
    p.baseSpeed = Math.max(1, p.baseSpeed ?? 5)
    p.isDead = false // always respawn alive
    if (Array.isArray(p.activeBuffs)) {
      p.activeBuffs = p.activeBuffs.filter((b: any) =>
        b &&
        VALID_BUFF_STATS.has(b.stat) &&
        Number.isFinite(b.amount) &&
        Number.isFinite(b.remaining) &&
        b.remaining > 0 &&
        b.remaining <= MAX_BUFF_DURATION_SEC
      )
    }
  }
  const inv = data.inventory
  if (inv?.resources) {
    for (const k of Object.keys(inv.resources)) {
      inv.resources[k] = Math.max(0, inv.resources[k] ?? 0)
    }
  }
  if (data.world) {
    data.world.worldTime = clamp(data.world.worldTime ?? 60, 0, 240)
    data.world.dayCount = Math.max(1, Math.floor(data.world.dayCount ?? 1))
    data.world.weatherIntensity = clamp(data.world.weatherIntensity ?? 0, 0, 1)
    data.world.eventTimer = Math.max(0, data.world.eventTimer ?? 0)
  }
  if (data.colony) {
    data.colony.population = Math.max(0, data.colony.population ?? 5)
    data.colony.maxPopulation = Math.max(1, data.colony.maxPopulation ?? 10)
    data.colony.armySize = Math.max(0, data.colony.armySize ?? 0)
  }
  if (data.research) {
    data.research.progress = clamp(data.research.progress ?? 0, 0, 1)
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false

    const data = JSON.parse(raw)
    // Guard against truncated or corrupted save data
    if (!data.player || !data.inventory || !data.colony || !data.quests || !data.research || !data.diplomacy || !data.world) return false
    // Upgrade older schemas in place, or bail if we can't
    if (!migrateSaveData(data)) return false

    // Sanitize values to prevent impossible game states from corrupt/edited saves
    sanitizeSaveData(data)

    // Restore module-level game loop state
    if (data.visitedBiomes) restoreVisitedBiomes(data.visitedBiomes)
    if (data.worldEventTimer !== undefined) restoreWorldEventTimer(data.worldEventTimer)

    // Clear combat state
    useCombatStore.getState().clearAll()
    resetBossAlive()

    // Restore player
    const ps = usePlayerStore.getState()
    ps.setPosition(data.player.positionX, data.player.positionY, data.player.positionZ)
    usePlayerStore.setState({
      hp: data.player.hp, maxHp: data.player.maxHp,
      stamina: data.player.stamina, maxStamina: data.player.maxStamina,
      level: data.player.level, xp: data.player.xp, xpToNext: data.player.xpToNext,
      skillPoints: data.player.skillPoints, skills: data.player.skills,
      role: data.player.role as any, equipment: data.player.equipment,
      baseAttack: data.player.baseAttack, baseDefense: data.player.baseDefense,
      baseSpeed: data.player.baseSpeed, isDead: false,
      activeBuffs: data.player.activeBuffs || [],
    })

    // Restore inventory + hotbar
    useInventoryStore.setState({
      resources: data.inventory.resources,
      items: data.inventory.items,
      hotbar: data.inventory.hotbar,
      selectedHotbarSlot: data.inventory.selectedHotbarSlot,
    })

    // Restore world + weather + events
    useWorldStore.setState({
      worldTime: data.world.worldTime,
      dayCount: data.world.dayCount,
      weather: data.world.weather,
      weatherIntensity: data.world.weatherIntensity,
      weatherTimer: data.world.weatherTimer,
      worldEvent: data.world.currentEvent,
      eventTimer: data.world.eventTimer,
    })

    useColonyStore.setState({
      buildings: data.colony.buildings,
      population: data.colony.population, maxPopulation: data.colony.maxPopulation, armySize: data.colony.armySize,
    })

    useQuestStore.setState({
      activeQuests: data.quests.activeQuests,
      completedQuests: data.quests.completedQuests,
    })

    // Restore research (including in-progress)
    const researchData: any = { completed: data.research.completed }
    if (data.research.current) researchData.currentResearch = data.research.current
    if (data.research.progress !== undefined) researchData.progress = data.research.progress
    useResearchStore.setState(researchData)

    useDiplomacyStore.setState({
      relations: data.diplomacy.relations,
      atWar: data.diplomacy.atWar,
    })

    // Restore crafting queue (v2+)
    useCraftingStore.setState({ queue: data.crafting.queue })

    const validTutorialSteps = ['welcome', 'movement', 'gather', 'build', 'fight', 'complete', null]
    const savedStep = data.tutorialStep
    const tutorialPatch = data.tutorialComplete
      ? { tutorialComplete: true, tutorialStep: null as any }
      : validTutorialSteps.includes(savedStep)
        ? { tutorialStep: savedStep as any }
        : {}
    useGameStore.setState({
      gameTime: data.gameTime,
      ...tutorialPatch,
    })

    useGameLogStore.getState().addMessage('Game loaded!', 'system')
    return true
  } catch (e) {
    console.error('Load failed:', e)
    useGameLogStore.getState().addMessage('Failed to load game!', 'system')
    return false
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}
