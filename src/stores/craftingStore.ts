import { create } from 'zustand'
import type { Recipe } from '../data/recipes'
import { useInventoryStore } from './inventoryStore'
import { useGameLogStore } from './gameStore'
import { EQUIPMENT } from '../data/equipment'

export interface CraftingQueueItem {
  recipeId: string
  name: string
  icon: string
  progress: number // 0-1
  craftTime: number
  result: string
}

interface CraftingState {
  queue: CraftingQueueItem[]
  addToQueue: (recipe: Recipe) => void
  tick: (dt: number) => void
  cancelItem: (index: number) => void
}

export const useCraftingStore = create<CraftingState>()((set, get) => ({
  queue: [],

  addToQueue: (recipe) => {
    const inv = useInventoryStore.getState()
    if (!inv.spendResources(recipe.cost)) return

    const item: CraftingQueueItem = {
      recipeId: recipe.id,
      name: recipe.name,
      icon: recipe.icon,
      progress: 0,
      craftTime: recipe.craftTime,
      result: recipe.result,
    }
    set((s) => ({ queue: [...s.queue, item] }))
    useGameLogStore.getState().addMessage(`Started crafting ${recipe.name}`, 'system')
  },

  tick: (dt) => {
    const state = get()
    if (state.queue.length === 0) return

    const newQueue = [...state.queue]
    const first = { ...newQueue[0] }
    first.progress += dt / first.craftTime

    if (first.progress >= 1) {
      // Complete crafting
      newQueue.shift()

      // Give result item
      const equip = EQUIPMENT.find((e) => e.id === first.result)
      if (equip) {
        useInventoryStore.getState().addItem({
          id: `${equip.id}-${Date.now()}`,
          name: equip.name,
          type: equip.type,
          rarity: equip.rarity,
          icon: equip.icon || first.icon,
          stats: equip.stats,
          description: equip.description,
        })
      }
      useGameLogStore.getState().addMessage(`Crafted ${first.name}!`, 'loot')
    } else {
      newQueue[0] = first
    }

    set({ queue: newQueue })
  },

  cancelItem: (index) =>
    set((s) => ({ queue: s.queue.filter((_, i) => i !== index) })),
}))
