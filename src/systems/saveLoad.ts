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

const SAVE_KEY = 'ant-sim-save'

interface SaveData {
  version: 2
  timestamp: number
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
    weather: string; weatherIntensity: number
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

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false

    const data = JSON.parse(raw)
    // Support both v1 and v2
    if (data.version !== 1 && data.version !== 2) return false

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
    const invData: any = { resources: data.inventory.resources, items: data.inventory.items }
    if (data.inventory.hotbar) invData.hotbar = data.inventory.hotbar
    if (data.inventory.selectedHotbarSlot !== undefined) invData.selectedHotbarSlot = data.inventory.selectedHotbarSlot
    useInventoryStore.setState(invData)

    // Restore world + weather + events
    const worldData: any = { worldTime: data.world.worldTime, dayCount: data.world.dayCount }
    if (data.world.weather) worldData.weather = data.world.weather
    if (data.world.weatherIntensity !== undefined) worldData.weatherIntensity = data.world.weatherIntensity
    if (data.world.currentEvent) worldData.worldEvent = data.world.currentEvent
    if (data.world.eventTimer) worldData.eventTimer = data.world.eventTimer
    useWorldStore.setState(worldData)

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
    if (data.research.progress) researchData.progress = data.research.progress
    useResearchStore.setState(researchData)

    useDiplomacyStore.setState({
      relations: data.diplomacy.relations,
      atWar: data.diplomacy.atWar,
    })

    // Restore crafting queue (v2+)
    if (data.crafting?.queue) {
      useCraftingStore.setState({ queue: data.crafting.queue })
    }

    useGameStore.setState({
      gameTime: data.gameTime,
      ...(data.tutorialComplete ? { tutorialComplete: true, tutorialStep: null as any } : {}),
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
