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

interface CombatState {
  enemies: EnemyInstance[]
  projectiles: Projectile[]
  isInCombat: boolean

  // Internal maps for O(1) lookups
  _enemyMap: Map<string, EnemyInstance>
  _projectileMap: Map<string, Projectile>

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
  getEnemy: (id: string) => EnemyInstance | undefined
}

function mapToArray<T>(map: Map<string, T>): T[] {
  return Array.from(map.values())
}

export const useCombatStore = create<CombatState>()((set, get) => ({
  enemies: [],
  projectiles: [],
  isInCombat: false,
  _enemyMap: new Map(),
  _projectileMap: new Map(),

  addEnemy: (enemy) =>
    set((s) => {
      const newMap = new Map(s._enemyMap)
      newMap.set(enemy.id, enemy)
      return { _enemyMap: newMap, enemies: mapToArray(newMap) }
    }),

  removeEnemy: (id) =>
    set((s) => {
      const newMap = new Map(s._enemyMap)
      newMap.delete(id)
      return { _enemyMap: newMap, enemies: mapToArray(newMap) }
    }),

  updateEnemy: (id, update) =>
    set((s) => {
      const existing = s._enemyMap.get(id)
      if (!existing) return s
      const updated = { ...existing, ...update }
      const newMap = new Map(s._enemyMap)
      newMap.set(id, updated)
      return { _enemyMap: newMap, enemies: mapToArray(newMap) }
    }),

  damageEnemy: (id, amount) => {
    const state = get()
    const enemy = state._enemyMap.get(id)
    if (!enemy) return null
    const newHp = enemy.hp - Math.max(1, amount - enemy.defense * 0.2)
    if (newHp <= 0) {
      const newMap = new Map(state._enemyMap)
      newMap.delete(id)
      set({ _enemyMap: newMap, enemies: mapToArray(newMap) })
      return { ...enemy, hp: 0 }
    }
    const updated = { ...enemy, hp: newHp, isAggro: true }
    const newMap = new Map(state._enemyMap)
    newMap.set(id, updated)
    set({ _enemyMap: newMap, enemies: mapToArray(newMap) })
    return updated
  },

  setEnemies: (enemies) => {
    const newMap = new Map<string, EnemyInstance>()
    for (const e of enemies) newMap.set(e.id, e)
    set({ _enemyMap: newMap, enemies })
  },

  addProjectile: (p) =>
    set((s) => {
      const newMap = new Map(s._projectileMap)
      newMap.set(p.id, p)
      return { _projectileMap: newMap, projectiles: mapToArray(newMap) }
    }),

  removeProjectile: (id) =>
    set((s) => {
      const newMap = new Map(s._projectileMap)
      newMap.delete(id)
      return { _projectileMap: newMap, projectiles: mapToArray(newMap) }
    }),

  setProjectiles: (p) => {
    const newMap = new Map<string, Projectile>()
    for (const proj of p) newMap.set(proj.id, proj)
    set({ _projectileMap: newMap, projectiles: p })
  },

  setInCombat: (v) => set({ isInCombat: v }),

  clearAll: () => set({
    enemies: [],
    projectiles: [],
    isInCombat: false,
    _enemyMap: new Map(),
    _projectileMap: new Map(),
  }),

  getEnemy: (id) => get()._enemyMap.get(id),
}))
