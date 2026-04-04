import type { Rarity } from '../stores/inventoryStore'

export interface ResourceDef {
  id: string
  name: string
  icon: string
  color: string
  baseYield: number
  gatherTime: number // seconds
}

export const RESOURCES: ResourceDef[] = [
  { id: 'food', name: 'Food', icon: '🍖', color: '#e67e22', baseYield: 5, gatherTime: 1.5 },
  { id: 'wood', name: 'Wood', icon: '🪵', color: '#8b4513', baseYield: 3, gatherTime: 2 },
  { id: 'leaves', name: 'Leaves', icon: '🍃', color: '#27ae60', baseYield: 4, gatherTime: 1 },
  { id: 'minerals', name: 'Minerals', icon: '💎', color: '#7f8c8d', baseYield: 2, gatherTime: 3 },
  { id: 'water', name: 'Water', icon: '💧', color: '#3498db', baseYield: 6, gatherTime: 1 },
]

export interface QualityTier {
  name: Rarity
  color: string
  yieldMultiplier: number
  chance: number // cumulative chance
  glowIntensity: number
}

export const QUALITY_TIERS: QualityTier[] = [
  { name: 'common', color: '#9ca3af', yieldMultiplier: 1, chance: 0.6, glowIntensity: 0 },
  { name: 'uncommon', color: '#22c55e', yieldMultiplier: 1.5, chance: 0.85, glowIntensity: 0.3 },
  { name: 'rare', color: '#3b82f6', yieldMultiplier: 2.5, chance: 0.95, glowIntensity: 0.6 },
  { name: 'epic', color: '#a855f7', yieldMultiplier: 4, chance: 0.99, glowIntensity: 0.9 },
  { name: 'legendary', color: '#f59e0b', yieldMultiplier: 8, chance: 1, glowIntensity: 1.2 },
]

export function rollQuality(): QualityTier {
  const roll = Math.random()
  for (const tier of QUALITY_TIERS) {
    if (roll <= tier.chance) return tier
  }
  return QUALITY_TIERS[0]
}

export interface ResourceNode {
  id: string
  resourceType: string
  quality: Rarity
  x: number
  y: number
  z: number
  amount: number
  maxAmount: number
  respawnTimer: number
  glowIntensity: number
}
