import type { Resources } from '../stores/inventoryStore'

export interface BuildingDef {
  id: string
  name: string
  icon: string
  description: string
  cost: Partial<Resources>
  buildTime: number // seconds
  maxLevel: number
  effects: Record<string, number> // per level bonus
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'nest_entrance',
    name: 'Nest Entrance',
    icon: '🕳️',
    description: 'Main colony entrance. Required for colony growth.',
    cost: { wood: 10, leaves: 5 },
    buildTime: 10,
    maxLevel: 5,
    effects: { populationCap: 5 },
  },
  {
    id: 'food_depot',
    name: 'Food Depot',
    icon: '🍖',
    description: 'Stores food resources. Increases max food storage.',
    cost: { wood: 15, leaves: 10 },
    buildTime: 8,
    maxLevel: 5,
    effects: { foodStorage: 100 },
  },
  {
    id: 'wood_pile',
    name: 'Wood Pile',
    icon: '🪵',
    description: 'Stores wood resources efficiently.',
    cost: { wood: 20 },
    buildTime: 6,
    maxLevel: 5,
    effects: { woodStorage: 100 },
  },
  {
    id: 'mineral_cache',
    name: 'Mineral Cache',
    icon: '💎',
    description: 'Secure storage for minerals and gems.',
    cost: { wood: 15, minerals: 10 },
    buildTime: 12,
    maxLevel: 5,
    effects: { mineralStorage: 100 },
  },
  {
    id: 'barracks',
    name: 'Barracks',
    icon: '⚔️',
    description: 'Trains soldier ants. Increases army size.',
    cost: { wood: 25, minerals: 15, food: 20 },
    buildTime: 20,
    maxLevel: 5,
    effects: { armySize: 3 },
  },
  {
    id: 'watchtower',
    name: 'Watchtower',
    icon: '🗼',
    description: 'Detects enemies from afar. Increases aggro range warning.',
    cost: { wood: 30, minerals: 10 },
    buildTime: 15,
    maxLevel: 3,
    effects: { detectionRange: 10 },
  },
  {
    id: 'research_lab',
    name: 'Research Lab',
    icon: '🔬',
    description: 'Enables advanced research. Speeds up research time.',
    cost: { wood: 20, minerals: 25, leaves: 15 },
    buildTime: 25,
    maxLevel: 3,
    effects: { researchSpeed: 0.2 },
  },
  {
    id: 'nursery',
    name: 'Nursery',
    icon: '🥚',
    description: 'Raises new ants. Increases population cap.',
    cost: { food: 30, leaves: 20, wood: 15 },
    buildTime: 18,
    maxLevel: 5,
    effects: { populationCap: 10 },
  },
  {
    id: 'queen_chamber',
    name: 'Queen Chamber',
    icon: '👑',
    description: 'Royal chamber. Boosts all colony stats.',
    cost: { wood: 50, minerals: 40, food: 30, leaves: 20 },
    buildTime: 45,
    maxLevel: 3,
    effects: { allBonus: 0.1 },
  },
  {
    id: 'bridge',
    name: 'Bridge',
    icon: '🌉',
    description: 'Spans gaps and water. Enables new paths.',
    cost: { wood: 35, minerals: 15 },
    buildTime: 12,
    maxLevel: 1,
    effects: { speedBonus: 0.1 },
  },
]
