import { create } from 'zustand'

export interface EnemyInstance {
  id: string
  type: string
  x: number
  y: number
  z: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  aggroRange: number
  isAggro: boolean
  isBoss: boolean
  attackPattern: 'melee' | 'ranged' | 'flying' | 'burrowing'
  lastAttackTime: number
  attackCooldown: number
  lootTable: string
}

interface CombatState {
  enemies: EnemyInstance[]
  projectiles: Projectile[]
  isInCombat: boolean

  addEnemy: (enemy: EnemyInstance) => void
  removeEnemy: (id: string) => void
  updateEnemy: (id: string, update: Partial<EnemyInstance>) => void
  damageEnemy: (id: string, amount: number) => EnemyInstance | null
  setEnemies: (enemies: EnemyInstance[]) => void
  addProjectile: (p: Projectile) => void
  removeProjectile: (id: string) => void
  setProjectiles: (p: Projectile[]) => void
  setInCombat: (v: boolean) => void
  clearAll: () => void
}

export interface Projectile {
  id: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  damage: number
  fromEnemy: boolean
  lifetime: number
}

export const useCombatStore = create<CombatState>()((set, get) => ({
  enemies: [],
  projectiles: [],
  isInCombat: false,

  addEnemy: (enemy) =>
    set((s) => ({ enemies: [...s.enemies, enemy] })),

  removeEnemy: (id) =>
    set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) })),

  updateEnemy: (id, update) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, ...update } : e)),
    })),

  damageEnemy: (id, amount) => {
    const state = get()
    const enemy = state.enemies.find((e) => e.id === id)
    if (!enemy) return null
    const newHp = enemy.hp - Math.max(1, amount - enemy.defense * 0.2)
    if (newHp <= 0) {
      set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) }))
      return { ...enemy, hp: 0 }
    }
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, hp: newHp, isAggro: true } : e)),
    }))
    return { ...enemy, hp: newHp }
  },

  setEnemies: (enemies) => set({ enemies }),

  addProjectile: (p) =>
    set((s) => ({ projectiles: [...s.projectiles, p] })),

  removeProjectile: (id) =>
    set((s) => ({ projectiles: s.projectiles.filter((p) => p.id !== id) })),

  setProjectiles: (p) => set({ projectiles: p }),

  setInCombat: (v) => set({ isInCombat: v }),

  clearAll: () => set({ enemies: [], projectiles: [], isInCombat: false }),
}))
