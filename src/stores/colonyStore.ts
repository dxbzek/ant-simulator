import { create } from 'zustand'
import { useQuestStore } from './questStore'

export interface PlacedBuilding {
  id: string
  type: string
  x: number
  y: number
  z: number
  level: number
  buildProgress: number // 0-1, 1 = complete
  isComplete: boolean
}

interface ColonyState {
  buildings: PlacedBuilding[]
  population: number
  maxPopulation: number
  armySize: number

  addBuilding: (building: PlacedBuilding) => void
  upgradeBuilding: (id: string) => void
  updateBuildProgress: (id: string, progress: number) => void
  removeBuilding: (id: string) => void
  setPopulation: (n: number) => void
  setMaxPopulation: (n: number) => void
  setArmySize: (n: number) => void
}

export const useColonyStore = create<ColonyState>()((set, get) => ({
  buildings: [],
  population: 5,
  maxPopulation: 10,
  armySize: 0,

  addBuilding: (building) =>
    set((s) => ({ buildings: [...s.buildings, building] })),

  upgradeBuilding: (id) =>
    set((s) => ({
      buildings: s.buildings.map((b) =>
        b.id === id ? { ...b, level: b.level + 1 } : b
      ),
    })),

  updateBuildProgress: (id, progress) => {
    const wasComplete = get().buildings.find(b => b.id === id)?.isComplete
    set((s) => ({
      buildings: s.buildings.map((b) =>
        b.id === id ? { ...b, buildProgress: Math.min(1, progress), isComplete: progress >= 1 } : b
      ),
    }))
    if (!wasComplete && progress >= 1) {
      const building = get().buildings.find(b => b.id === id)
      if (building) {
        useQuestStore.getState().updateQuestsByType('build', building.type, 1)
      }
    }
  },

  removeBuilding: (id) =>
    set((s) => ({ buildings: s.buildings.filter((b) => b.id !== id) })),

  setPopulation: (n) => set({ population: n }),
  setMaxPopulation: (n) => set({ maxPopulation: n }),
  setArmySize: (n) => set({ armySize: n }),
}))
