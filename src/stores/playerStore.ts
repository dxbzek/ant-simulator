import { create } from 'zustand'
import { EQUIPMENT } from '../data/equipment'
import { useCombatStore } from './combatStore'

export type PlayerRole = 'worker' | 'soldier' | 'scout' | 'builder' | 'king'

export interface SkillPoints {
  attack: number
  defense: number
  speed: number
  health: number
}

export interface Equipment {
  weapon: string | null
  armor: string | null
  accessory: string | null
  helmet: string | null
}

export interface ActiveBuff {
  id: string
  name: string
  stat: 'attack' | 'defense' | 'speed'
  amount: number
  remaining: number // seconds left
  duration: number  // total duration
}

interface PlayerState {
  // Position
  positionX: number
  positionY: number
  positionZ: number
  velocityX: number
  velocityY: number
  velocityZ: number
  rotationY: number
  pitchX: number

  // Stats
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  level: number
  xp: number
  xpToNext: number
  skillPoints: number
  skills: SkillPoints
  role: PlayerRole

  // State
  isGrounded: boolean
  isSprinting: boolean
  isCrouching: boolean
  isSwimming: boolean
  isGliding: boolean
  isDead: boolean
  isAttacking: boolean

  // Equipment
  equipment: Equipment

  // Buffs
  activeBuffs: ActiveBuff[]

  // Base stats (modified by equipment and skills)
  baseAttack: number
  baseDefense: number
  baseSpeed: number

  // Actions
  setPosition: (x: number, y: number, z: number) => void
  setVelocity: (x: number, y: number, z: number) => void
  setRotation: (y: number, pitch: number) => void
  setGrounded: (v: boolean) => void
  setSprinting: (v: boolean) => void
  setCrouching: (v: boolean) => void
  setSwimming: (v: boolean) => void
  setGliding: (v: boolean) => void
  setAttacking: (v: boolean) => void
  takeDamage: (amount: number) => void
  heal: (amount: number) => void
  drainStamina: (amount: number) => void
  recoverStamina: (amount: number) => void
  addXp: (amount: number) => void
  levelUp: () => void
  allocateSkill: (skill: keyof SkillPoints) => void
  setRole: (role: PlayerRole) => void
  equipItem: (slot: keyof Equipment, itemId: string | null) => void
  addBuff: (buff: Omit<ActiveBuff, 'id'>) => void
  tickBuffs: (dt: number) => void
  getBuffBonus: (stat: 'attack' | 'defense' | 'speed') => number
  die: () => void
  respawn: () => void
  getEffectiveAttack: () => number
  getEffectiveDefense: () => number
  getEffectiveSpeed: () => number
  getEquipmentHpBonus: () => number
}

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  positionX: 0,
  positionY: 0.5,
  positionZ: 0,
  velocityX: 0,
  velocityY: 0,
  velocityZ: 0,
  rotationY: 0,
  pitchX: 0,

  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  level: 1,
  xp: 0,
  xpToNext: 100,
  skillPoints: 0,
  skills: { attack: 0, defense: 0, speed: 0, health: 0 },
  role: 'worker',

  isGrounded: false,
  isSprinting: false,
  isCrouching: false,
  isSwimming: false,
  isGliding: false,
  isDead: false,
  isAttacking: false,

  equipment: { weapon: null, armor: null, accessory: null, helmet: null },
  activeBuffs: [],

  baseAttack: 10,
  baseDefense: 5,
  baseSpeed: 5,

  setPosition: (x, y, z) => set({ positionX: x, positionY: y, positionZ: z }),
  setVelocity: (x, y, z) => set({ velocityX: x, velocityY: y, velocityZ: z }),
  setRotation: (y, pitch) => set({ rotationY: y, pitchX: pitch }),
  setGrounded: (v) => set({ isGrounded: v }),
  setSprinting: (v) => set({ isSprinting: v }),
  setCrouching: (v) => set({ isCrouching: v }),
  setSwimming: (v) => set({ isSwimming: v }),
  setGliding: (v) => set({ isGliding: v }),
  setAttacking: (v) => set({ isAttacking: v }),

  takeDamage: (amount) => {
    const state = get()
    const defense = state.getEffectiveDefense()
    const reduced = Math.max(1, amount - defense * 0.3)
    const newHp = Math.max(0, state.hp - reduced)
    set({ hp: newHp })
    if (newHp <= 0) get().die()
  },

  heal: (amount) => {
    const s = get()
    const effectiveMax = s.maxHp + s.getEquipmentHpBonus()
    set({ hp: Math.min(effectiveMax, s.hp + amount) })
  },

  drainStamina: (amount) => set((s) => ({ stamina: Math.max(0, s.stamina - amount) })),
  recoverStamina: (amount) => set((s) => ({ stamina: Math.min(s.maxStamina, s.stamina + amount) })),

  addXp: (amount) => {
    const state = get()
    let xp = state.xp + amount
    let level = state.level
    let xpToNext = state.xpToNext
    let skillPoints = state.skillPoints
    let maxHp = state.maxHp
    let maxStamina = state.maxStamina

    while (xp >= xpToNext) {
      xp -= xpToNext
      level++
      skillPoints += 3
      xpToNext = xpForLevel(level)
      maxHp += 10
      maxStamina += 5
    }

    set({ xp, level, xpToNext, skillPoints, maxHp, maxStamina, hp: level > state.level ? maxHp : state.hp })
  },

  levelUp: () => {}, // handled in addXp

  allocateSkill: (skill) => {
    const state = get()
    if (state.skillPoints <= 0) return
    set({
      skillPoints: state.skillPoints - 1,
      skills: { ...state.skills, [skill]: state.skills[skill] + 1 },
    })
    if (skill === 'health') {
      set((s) => ({ maxHp: s.maxHp + 5, hp: s.hp + 5 }))
    }
  },

  setRole: (role) => set({ role }),

  equipItem: (slot, itemId) =>
    set((s) => ({ equipment: { ...s.equipment, [slot]: itemId } })),

  addBuff: (buff) => {
    const id = `buff-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    set((s) => ({
      activeBuffs: [...s.activeBuffs.filter(b => b.stat !== buff.stat), { ...buff, id }],
    }))
  },

  tickBuffs: (dt) => {
    const state = get()
    if (state.activeBuffs.length === 0) return
    const updated = state.activeBuffs
      .map(b => ({ ...b, remaining: b.remaining - dt }))
      .filter(b => b.remaining > 0)
    if (updated.length !== state.activeBuffs.length || updated.some((b, i) => b.remaining !== state.activeBuffs[i]?.remaining)) {
      set({ activeBuffs: updated })
    }
  },

  getBuffBonus: (stat) => {
    return get().activeBuffs
      .filter(b => b.stat === stat)
      .reduce((sum, b) => sum + b.amount, 0)
  },

  die: () => {
    set({ isDead: true })
    useCombatStore.getState().clearAll()
  },

  respawn: () =>
    set((s) => ({
      isDead: false,
      hp: Math.floor(s.maxHp * 0.5),
      stamina: s.maxStamina,
      positionX: 0,
      positionY: 0.5,
      positionZ: 0,
    })),

  getEffectiveAttack: () => {
    const s = get()
    let total = s.baseAttack + s.skills.attack * 2 + s.level

    // Equipment bonuses
    for (const slot of Object.values(s.equipment)) {
      if (!slot) continue
      const equip = EQUIPMENT.find(e => e.id === slot)
      if (equip?.stats?.attack) total += equip.stats.attack
    }

    // Role bonus
    if (s.role === 'soldier') total *= 1.2
    else if (s.role === 'king') total *= 1.15

    // Research bonuses (read from researchStore lazily)
    total *= 1 + getResearchBonus('attackBonus')

    // Active buffs
    total += get().getBuffBonus('attack')

    return Math.floor(total)
  },
  getEffectiveDefense: () => {
    const s = get()
    let total = s.baseDefense + s.skills.defense * 2 + Math.floor(s.level * 0.5)

    for (const slot of Object.values(s.equipment)) {
      if (!slot) continue
      const equip = EQUIPMENT.find(e => e.id === slot)
      if (equip?.stats?.defense) total += equip.stats.defense
    }

    if (s.role === 'builder') total *= 1.15
    else if (s.role === 'king') total *= 1.1

    total *= 1 + getResearchBonus('defenseBonus')

    // Active buffs
    total += get().getBuffBonus('defense')

    return Math.floor(total)
  },
  getEffectiveSpeed: () => {
    const s = get()
    let total = s.baseSpeed + s.skills.speed * 1.5

    for (const slot of Object.values(s.equipment)) {
      if (!slot) continue
      const equip = EQUIPMENT.find(e => e.id === slot)
      if (equip?.stats?.speed) total += equip.stats.speed
    }

    if (s.role === 'scout') total *= 1.25
    else if (s.role === 'king') total *= 1.1

    total *= 1 + getResearchBonus('speedBonus')

    // Active buffs
    total += get().getBuffBonus('speed')

    return total
  },
  getEquipmentHpBonus: () => {
    const s = get()
    let bonus = 0
    for (const slot of Object.values(s.equipment)) {
      if (!slot) continue
      const equip = EQUIPMENT.find(e => e.id === slot)
      if (equip?.stats?.hp) bonus += equip.stats.hp
    }
    return bonus
  },
}))

// Research bonus reader — uses lazy reference to avoid circular imports
let _researchStoreRef: any = null
let _researchNodesRef: any = null

export function _setResearchRefs(store: any, nodes: any) {
  _researchStoreRef = store
  _researchNodesRef = nodes
}

function getResearchBonus(effectPrefix: string): number {
  if (!_researchStoreRef || !_researchNodesRef) return 0
  const completed = _researchStoreRef.getState().completed
  let bonus = 0
  for (const nodeId of completed) {
    const node = _researchNodesRef.find((n: any) => n.id === nodeId)
    if (node?.effect?.startsWith(effectPrefix + ':')) {
      bonus += parseFloat(node.effect.split(':')[1]) || 0
    }
  }
  return bonus
}
