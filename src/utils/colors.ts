export const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
} as const

export const BIOME_COLORS = {
  forest: { ground: '#2d5a1e', accent: '#4a7c2e', fog: '#1a3a0e' },
  garden: { ground: '#4a8c3f', accent: '#6ab04c', fog: '#2d5a1e' },
  cave: { ground: '#3d3d3d', accent: '#5a5a5a', fog: '#1a1a2e' },
  desert: { ground: '#c2a366', accent: '#d4b878', fog: '#a08850' },
  swamp: { ground: '#2d4a2d', accent: '#4a6b3a', fog: '#1a2e1a' },
} as const

export const RESOURCE_COLORS = {
  food: '#e67e22',
  wood: '#8b4513',
  leaves: '#27ae60',
  minerals: '#7f8c8d',
  water: '#3498db',
} as const
