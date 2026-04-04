export type AttackPattern = 'melee' | 'ranged' | 'flying' | 'burrowing'

export interface EnemyDef {
  id: string
  name: string
  hp: number
  attack: number
  defense: number
  speed: number
  aggroRange: number
  attackPattern: AttackPattern
  attackCooldown: number
  xpReward: number
  isBoss: boolean
  color: string
  scale: number
  lootTable: LootEntry[]
  biomes: string[]
  minLevel: number
}

export interface LootEntry {
  itemId: string
  chance: number // 0-1
  rarity: string
}

export const ENEMIES: EnemyDef[] = [
  {
    id: 'spider',
    name: 'Garden Spider',
    hp: 30, attack: 8, defense: 2, speed: 3,
    aggroRange: 8, attackPattern: 'melee', attackCooldown: 1.5,
    xpReward: 15, isBoss: false, color: '#4a4a4a', scale: 1.2,
    lootTable: [{ itemId: 'spider_fang', chance: 0.3, rarity: 'common' }],
    biomes: ['forest', 'garden'], minLevel: 1,
  },
  {
    id: 'beetle',
    name: 'Bark Beetle',
    hp: 50, attack: 6, defense: 8, speed: 2,
    aggroRange: 6, attackPattern: 'melee', attackCooldown: 2,
    xpReward: 20, isBoss: false, color: '#5a3a1a', scale: 1.0,
    lootTable: [{ itemId: 'beetle_shell', chance: 0.25, rarity: 'uncommon' }],
    biomes: ['forest', 'cave'], minLevel: 1,
  },
  {
    id: 'centipede',
    name: 'Centipede',
    hp: 40, attack: 12, defense: 3, speed: 5,
    aggroRange: 10, attackPattern: 'melee', attackCooldown: 0.8,
    xpReward: 25, isBoss: false, color: '#8b0000', scale: 1.5,
    lootTable: [{ itemId: 'centipede_leg', chance: 0.2, rarity: 'uncommon' }],
    biomes: ['cave', 'swamp'], minLevel: 3,
  },
  {
    id: 'aphid',
    name: 'Aphid',
    hp: 15, attack: 3, defense: 1, speed: 2,
    aggroRange: 4, attackPattern: 'melee', attackCooldown: 2,
    xpReward: 5, isBoss: false, color: '#90ee90', scale: 0.6,
    lootTable: [{ itemId: 'honeydew', chance: 0.5, rarity: 'common' }],
    biomes: ['garden', 'forest'], minLevel: 1,
  },
  {
    id: 'wasp',
    name: 'Wasp',
    hp: 35, attack: 15, defense: 2, speed: 7,
    aggroRange: 12, attackPattern: 'flying', attackCooldown: 1.2,
    xpReward: 30, isBoss: false, color: '#ffd700', scale: 1.3,
    lootTable: [{ itemId: 'wasp_stinger', chance: 0.2, rarity: 'rare' }],
    biomes: ['garden', 'forest'], minLevel: 5,
  },
  {
    id: 'ant_archer',
    name: 'Rival Ant Archer',
    hp: 25, attack: 10, defense: 3, speed: 4,
    aggroRange: 15, attackPattern: 'ranged', attackCooldown: 2,
    xpReward: 20, isBoss: false, color: '#cc4444', scale: 0.8,
    lootTable: [{ itemId: 'acid_sac', chance: 0.3, rarity: 'uncommon' }],
    biomes: ['desert', 'forest'], minLevel: 3,
  },
  {
    id: 'dragonfly',
    name: 'Dragonfly',
    hp: 45, attack: 14, defense: 4, speed: 8,
    aggroRange: 14, attackPattern: 'flying', attackCooldown: 1,
    xpReward: 35, isBoss: false, color: '#4169e1', scale: 1.8,
    lootTable: [{ itemId: 'wing_shard', chance: 0.15, rarity: 'rare' }],
    biomes: ['swamp', 'garden'], minLevel: 7,
  },
  {
    id: 'mole_cricket',
    name: 'Mole Cricket',
    hp: 60, attack: 10, defense: 6, speed: 3,
    aggroRange: 8, attackPattern: 'burrowing', attackCooldown: 2.5,
    xpReward: 30, isBoss: false, color: '#8b7355', scale: 1.4,
    lootTable: [{ itemId: 'chitin_plate', chance: 0.2, rarity: 'uncommon' }],
    biomes: ['cave', 'desert'], minLevel: 5,
  },
  // Bosses
  {
    id: 'boss_spider_queen',
    name: 'Spider Queen',
    hp: 200, attack: 20, defense: 8, speed: 4,
    aggroRange: 15, attackPattern: 'ranged', attackCooldown: 1.5,
    xpReward: 150, isBoss: true, color: '#2d0a2d', scale: 3.0,
    lootTable: [
      { itemId: 'queens_fang', chance: 1, rarity: 'epic' },
      { itemId: 'silk_armor', chance: 0.5, rarity: 'rare' },
    ],
    biomes: ['forest'], minLevel: 10,
  },
  {
    id: 'boss_beetle_king',
    name: 'Beetle King',
    hp: 300, attack: 15, defense: 15, speed: 2,
    aggroRange: 12, attackPattern: 'melee', attackCooldown: 2,
    xpReward: 200, isBoss: true, color: '#1a0a00', scale: 3.5,
    lootTable: [
      { itemId: 'kings_horn', chance: 1, rarity: 'epic' },
      { itemId: 'obsidian_shell', chance: 0.5, rarity: 'epic' },
    ],
    biomes: ['cave'], minLevel: 15,
  },
  {
    id: 'boss_wasp_emperor',
    name: 'Wasp Emperor',
    hp: 250, attack: 25, defense: 5, speed: 9,
    aggroRange: 20, attackPattern: 'flying', attackCooldown: 0.8,
    xpReward: 250, isBoss: true, color: '#aa8800', scale: 4.0,
    lootTable: [
      { itemId: 'emperors_crown', chance: 1, rarity: 'legendary' },
      { itemId: 'golden_wings', chance: 0.3, rarity: 'legendary' },
    ],
    biomes: ['garden'], minLevel: 20,
  },
]
