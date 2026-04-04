import { useWorldStore } from '../stores/worldStore'
import { useCraftingStore } from '../stores/craftingStore'
import { useResearchStore } from '../stores/researchStore'
import { useQuestStore } from '../stores/questStore'
import { usePlayerStore } from '../stores/playerStore'
import { useColonyStore } from '../stores/colonyStore'
import { useGameStore, useGameLogStore } from '../stores/gameStore'
import { INITIAL_QUESTS } from '../data/quests'
import { fbm2D } from '../utils/noise'

let initialized = false
let worldEventTimer = 120 // seconds until first event

export function initGame() {
  if (initialized) return
  initialized = true

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
        useGameLogStore.getState().addMessage(
          `Quest completed: ${completed.name}! +${completed.rewards.xp || 0} XP`,
          'quest'
        )
      }
    }
  }
}

const WORLD_EVENTS = ['migration', 'resourceBloom', 'invasion', 'plague', 'goldenAge'] as const

function tickWorldEvents(dt: number) {
  worldEventTimer -= dt
  if (worldEventTimer <= 0) {
    worldEventTimer = 120 + Math.random() * 180 // 2-5 minutes
    const event = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)]
    const duration = 30 + Math.random() * 30
    useWorldStore.getState().setWorldEvent(event, duration)
    useGameLogStore.getState().addMessage(`World Event: ${event}!`, 'system')
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
  }
}
