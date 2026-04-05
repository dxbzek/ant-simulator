import { create } from 'zustand'

export interface Resources {
  food: number
  wood: number
  leaves: number
  minerals: number
  water: number
}

export type ResourceType = keyof Resources

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface InventoryItem {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'accessory' | 'helmet' | 'consumable' | 'material'
  rarity: Rarity
  icon: string
  stats?: Record<string, number>
  description?: string
}

export interface HotbarSlot {
  item?: InventoryItem
  icon?: string
  cooldown?: number
  maxCooldown?: number
}

interface InventoryState {
  resources: Resources
  items: InventoryItem[]
  hotbar: (HotbarSlot | null)[]
  selectedHotbarSlot: number

  addResource: (type: ResourceType, amount: number) => void
  removeResource: (type: ResourceType, amount: number) => boolean
  hasResources: (costs: Partial<Resources>) => boolean
  spendResources: (costs: Partial<Resources>) => boolean
  addItem: (item: InventoryItem) => void
  removeItem: (id: string) => void
  setHotbarSlot: (index: number, slot: HotbarSlot | null) => void
  selectHotbarSlot: (index: number) => void
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  resources: { food: 0, wood: 0, leaves: 0, minerals: 0, water: 0 },
  items: [],
  hotbar: [null, null, null, null, null],
  selectedHotbarSlot: 0,

  addResource: (type, amount) =>
    set((s) => {
      // Import storage limits lazily to avoid circular deps
      const limits = _getStorageLimits()
      const max = limits[type] || 9999
      return {
        resources: { ...s.resources, [type]: Math.min(max, s.resources[type] + amount) },
      }
    }),

  removeResource: (type, amount) => {
    const state = get()
    if (state.resources[type] < amount) return false
    set({ resources: { ...state.resources, [type]: state.resources[type] - amount } })
    return true
  },

  hasResources: (costs) => {
    const r = get().resources
    return Object.entries(costs).every(([type, amount]) => r[type as ResourceType] >= (amount || 0))
  },

  spendResources: (costs) => {
    const state = get()
    if (!state.hasResources(costs)) return false
    const newResources = { ...state.resources }
    for (const [type, amount] of Object.entries(costs)) {
      newResources[type as ResourceType] -= amount || 0
    }
    set({ resources: newResources })
    return true
  },

  addItem: (item) =>
    set((s) => ({ items: [...s.items, item] })),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  setHotbarSlot: (index, slot) =>
    set((s) => {
      const newHotbar = [...s.hotbar]
      newHotbar[index] = slot
      return { hotbar: newHotbar }
    }),

  selectHotbarSlot: (index) => set({ selectedHotbarSlot: index }),
}))

// Lazy reference to storage limits from gameLoop (avoids circular import)
let _storageLimitsRef: Record<string, number> | null = null

function _getStorageLimits(): Record<string, number> {
  if (!_storageLimitsRef) {
    // Default limits before gameLoop initializes
    return { food: 200, wood: 200, leaves: 200, minerals: 200, water: 200 }
  }
  return _storageLimitsRef
}

export function _setStorageLimitsRef(ref: Record<string, number>) {
  _storageLimitsRef = ref
}
