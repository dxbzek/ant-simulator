import { fbm2D } from '../utils/noise'

export interface BiomeDef {
  id: string
  name: string
  displayName: string
  groundColor: [number, number, number]
  fogColor: [number, number, number]
  resourceMultipliers: Record<string, number>
  enemyTypes: string[]
  vegetationDensity: number
  description: string
}

export const BIOMES: BiomeDef[] = [
  {
    id: 'forest',
    name: 'forest',
    displayName: 'Forest Floor',
    groundColor: [0.18, 0.35, 0.12],
    fogColor: [0.1, 0.22, 0.06],
    resourceMultipliers: { food: 1.2, wood: 1.5, leaves: 1.3, minerals: 0.8, water: 1 },
    enemyTypes: ['spider', 'beetle', 'aphid'],
    vegetationDensity: 0.8,
    description: 'Rich forest floor teeming with life. Good for wood and leaves.',
  },
  {
    id: 'garden',
    name: 'garden',
    displayName: 'Backyard Garden',
    groundColor: [0.29, 0.55, 0.25],
    fogColor: [0.2, 0.4, 0.15],
    resourceMultipliers: { food: 1.5, wood: 0.8, leaves: 1.5, minerals: 0.7, water: 1.2 },
    enemyTypes: ['aphid', 'wasp', 'dragonfly'],
    vegetationDensity: 1.0,
    description: 'A lush garden with abundant food and flowers.',
  },
  {
    id: 'cave',
    name: 'cave',
    displayName: 'Underground Cave',
    groundColor: [0.24, 0.24, 0.24],
    fogColor: [0.08, 0.08, 0.12],
    resourceMultipliers: { food: 0.5, wood: 0.3, leaves: 0.2, minerals: 2.0, water: 1.5 },
    enemyTypes: ['beetle', 'centipede', 'mole_cricket'],
    vegetationDensity: 0.2,
    description: 'Dark underground caves rich in minerals.',
  },
  {
    id: 'desert',
    name: 'desert',
    displayName: 'Sandy Wastes',
    groundColor: [0.76, 0.64, 0.4],
    fogColor: [0.6, 0.5, 0.3],
    resourceMultipliers: { food: 0.5, wood: 0.5, leaves: 0.3, minerals: 1.5, water: 0.3 },
    enemyTypes: ['ant_archer', 'mole_cricket'],
    vegetationDensity: 0.15,
    description: 'Harsh desert with scarce resources but rich minerals.',
  },
  {
    id: 'swamp',
    name: 'swamp',
    displayName: 'Toxic Swamp',
    groundColor: [0.18, 0.29, 0.18],
    fogColor: [0.1, 0.18, 0.1],
    resourceMultipliers: { food: 0.8, wood: 0.7, leaves: 1.2, minerals: 1.0, water: 2.0 },
    enemyTypes: ['centipede', 'dragonfly'],
    vegetationDensity: 0.6,
    description: 'Murky swamp with toxic waters. Rich in water resources.',
  },
]

export function getBiomeAt(x: number, z: number): BiomeDef {
  // Simple biome assignment based on noise (matches Terrain.tsx logic)
  const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)

  if (biomeNoise < -0.3) return BIOMES[3] // desert
  if (biomeNoise < -0.05) return BIOMES[4] // swamp
  if (biomeNoise < 0.2) return BIOMES[0] // forest
  if (biomeNoise < 0.45) return BIOMES[1] // garden
  return BIOMES[2] // cave
}
