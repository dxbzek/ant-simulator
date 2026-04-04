import { usePlayerStore } from '../stores/playerStore'
import { useInventoryStore } from '../stores/inventoryStore'
import { useWorldStore } from '../stores/worldStore'
import { useColonyStore } from '../stores/colonyStore'
import { useQuestStore } from '../stores/questStore'
import { useResearchStore } from '../stores/researchStore'
import { useDiplomacyStore } from '../stores/diplomacyStore'
import { useGameStore, useGameLogStore } from '../stores/gameStore'

const SAVE_KEY = 'ant-sim-save'

interface SaveData {
  version: 1
  timestamp: number
  player: {
    positionX: number; positionY: number; positionZ: number
    hp: number; maxHp: number; stamina: number; maxStamina: number
    level: number; xp: number; xpToNext: number
    skillPoints: number; skills: any
    role: string; equipment: any
    baseAttack: number; baseDefense: number; baseSpeed: number
  }
  inventory: {
    resources: any
    items: any[]
  }
  world: {
    worldTime: number; dayCount: number
    weather: string
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
  }
  diplomacy: {
    relations: Record<string, number>
    atWar: string[]
  }
  gameTime: number
}

export function saveGame(): boolean {
  try {
    const player = usePlayerStore.getState()
    const inventory = useInventoryStore.getState()
    const world = useWorldStore.getState()
    const colony = useColonyStore.getState()
    const quests = useQuestStore.getState()
    const research = useResearchStore.getState()
    const diplomacy = useDiplomacyStore.getState()
    const game = useGameStore.getState()

    const data: SaveData = {
      version: 1,
      timestamp: Date.now(),
      player: {
        positionX: player.positionX, positionY: player.positionY, positionZ: player.positionZ,
        hp: player.hp, maxHp: player.maxHp, stamina: player.stamina, maxStamina: player.maxStamina,
        level: player.level, xp: player.xp, xpToNext: player.xpToNext,
        skillPoints: player.skillPoints, skills: player.skills,
        role: player.role, equipment: player.equipment,
        baseAttack: player.baseAttack, baseDefense: player.baseDefense, baseSpeed: player.baseSpeed,
      },
      inventory: {
        resources: inventory.resources,
        items: inventory.items,
      },
      world: {
        worldTime: world.worldTime, dayCount: world.dayCount,
        weather: world.weather,
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
      },
      diplomacy: {
        relations: diplomacy.relations,
        atWar: diplomacy.atWar,
      },
      gameTime: game.gameTime,
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    useGameLogStore.getState().addMessage('Game saved!', 'system')
    return true
  } catch (e) {
    console.error('Save failed:', e)
    return false
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false

    const data: SaveData = JSON.parse(raw)
    if (data.version !== 1) return false

    // Restore state
    const ps = usePlayerStore.getState()
    ps.setPosition(data.player.positionX, data.player.positionY, data.player.positionZ)
    usePlayerStore.setState({
      hp: data.player.hp, maxHp: data.player.maxHp,
      stamina: data.player.stamina, maxStamina: data.player.maxStamina,
      level: data.player.level, xp: data.player.xp, xpToNext: data.player.xpToNext,
      skillPoints: data.player.skillPoints, skills: data.player.skills,
      role: data.player.role as any, equipment: data.player.equipment,
      baseAttack: data.player.baseAttack, baseDefense: data.player.baseDefense,
      baseSpeed: data.player.baseSpeed,
    })

    useInventoryStore.setState({
      resources: data.inventory.resources,
      items: data.inventory.items,
    })

    useWorldStore.setState({
      worldTime: data.world.worldTime,
      dayCount: data.world.dayCount,
    })

    useColonyStore.setState({
      buildings: data.colony.buildings,
      population: data.colony.population,
      maxPopulation: data.colony.maxPopulation,
      armySize: data.colony.armySize,
    })

    useQuestStore.setState({
      activeQuests: data.quests.activeQuests,
      completedQuests: data.quests.completedQuests,
    })

    useResearchStore.setState({
      completed: data.research.completed,
    })

    useDiplomacyStore.setState({
      relations: data.diplomacy.relations,
      atWar: data.diplomacy.atWar,
    })

    useGameStore.setState({ gameTime: data.gameTime })

    useGameLogStore.getState().addMessage('Game loaded!', 'system')
    return true
  } catch (e) {
    console.error('Load failed:', e)
    return false
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}
