import { create } from 'zustand'
import { FACTIONS } from '../data/factions'
import { useInventoryStore } from './inventoryStore'
import { useGameLogStore } from './gameStore'

interface DiplomacyState {
  relations: Record<string, number> // faction id -> relation (-100 to 100)
  atWar: string[]

  tribute: (factionId: string) => void
  changeRelation: (factionId: string, amount: number) => void
  declareWar: (factionId: string) => void
  makePeace: (factionId: string) => void
}

export const useDiplomacyStore = create<DiplomacyState>()((set, get) => {
  const initialRelations: Record<string, number> = {}
  FACTIONS.forEach((f) => { initialRelations[f.id] = f.baseRelation })

  return {
    relations: initialRelations,
    atWar: [],

    tribute: (factionId) => {
      const inv = useInventoryStore.getState()
      if (inv.resources.food >= 20) {
        inv.removeResource('food', 20)
        get().changeRelation(factionId, 15)
        useGameLogStore.getState().addMessage(`Paid tribute to ${factionId}. Relations improved.`, 'system')
      }
    },

    changeRelation: (factionId, amount) =>
      set((s) => ({
        relations: {
          ...s.relations,
          [factionId]: Math.max(-100, Math.min(100, (s.relations[factionId] || 0) + amount)),
        },
      })),

    declareWar: (factionId) =>
      set((s) => {
        if (s.atWar.includes(factionId)) return s
        return {
          atWar: [...s.atWar, factionId],
          relations: { ...s.relations, [factionId]: -100 },
        }
      }),

    makePeace: (factionId) =>
      set((s) => ({
        atWar: s.atWar.filter((f) => f !== factionId),
        relations: { ...s.relations, [factionId]: -20 },
      })),
  }
})
