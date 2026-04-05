import { create } from 'zustand'
import { RESEARCH_NODES } from '../data/research'
import { useGameLogStore } from './gameStore'
import { usePlayerStore } from './playerStore'

interface ResearchState {
  completed: string[]
  currentResearch: string | null
  progress: number // 0-1

  startResearch: (nodeId: string) => void
  tick: (dt: number) => void
  isCompleted: (nodeId: string) => boolean
}

export const useResearchStore = create<ResearchState>()((set, get) => ({
  completed: [],
  currentResearch: null,
  progress: 0,

  startResearch: (nodeId) => {
    const state = get()
    if (state.currentResearch) return
    const node = RESEARCH_NODES.find((n) => n.id === nodeId)
    if (!node) return
    if (!node.prerequisites.every((p) => state.completed.includes(p))) return

    set({ currentResearch: nodeId, progress: 0 })
    useGameLogStore.getState().addMessage(`Started researching: ${node.name}`, 'system')
  },

  tick: (dt) => {
    const state = get()
    if (!state.currentResearch) return

    const node = RESEARCH_NODES.find((n) => n.id === state.currentResearch)
    if (!node) return

    // Apply research speed bonus from buildings
    const speedBonus = 1 + (_colonyResearchSpeed || 0)
    const newProgress = state.progress + (dt * speedBonus) / node.researchTime

    if (newProgress >= 1) {
      // Complete research
      set({
        completed: [...state.completed, state.currentResearch],
        currentResearch: null,
        progress: 0,
      })
      useGameLogStore.getState().addMessage(`Research complete: ${node.name}!`, 'system')

      // Apply effect
      if (node.effect.startsWith('role:')) {
        const role = node.effect.split(':')[1] as any
        usePlayerStore.getState().setRole(role)
      }
    } else {
      set({ progress: newProgress })
    }
  },

  isCompleted: (nodeId) => get().completed.includes(nodeId),
}))

// Lazy reference to colony research speed bonus (set by gameLoop to avoid circular import)
let _colonyResearchSpeed = 0
export function _setColonyResearchSpeed(speed: number) {
  _colonyResearchSpeed = speed
}
