export interface ResearchNode {
  id: string
  name: string
  icon: string
  category: 'combat' | 'gathering' | 'building' | 'evolution'
  prerequisites: string[]
  researchTime: number // seconds
  description: string
  effect: string
}

export const RESEARCH_NODES: ResearchNode[] = [
  // Combat
  { id: 'sharp_mandibles', name: 'Sharp Mandibles', icon: '⚔️', category: 'combat', prerequisites: [], researchTime: 30, description: '+10% attack damage', effect: 'attackBonus:0.1' },
  { id: 'tough_exo', name: 'Tough Exoskeleton', icon: '🛡️', category: 'combat', prerequisites: ['sharp_mandibles'], researchTime: 45, description: '+15% defense', effect: 'defenseBonus:0.15' },
  { id: 'venom_bite', name: 'Venom Bite', icon: '☠️', category: 'combat', prerequisites: ['sharp_mandibles'], researchTime: 60, description: 'Attacks apply poison', effect: 'venomDamage:3' },
  { id: 'strong_mandibles', name: 'Strong Mandibles', icon: '💪', category: 'combat', prerequisites: ['tough_exo', 'venom_bite'], researchTime: 90, description: '+25% attack', effect: 'attackBonus:0.25' },

  // Gathering
  { id: 'faster_legs', name: 'Faster Legs', icon: '🦵', category: 'gathering', prerequisites: [], researchTime: 20, description: '+15% movement speed', effect: 'speedBonus:0.15' },
  { id: 'efficient_crop', name: 'Efficient Crop', icon: '🌾', category: 'gathering', prerequisites: ['faster_legs'], researchTime: 40, description: '+20% gather rate', effect: 'gatherBonus:0.2' },
  { id: 'expanded_crop', name: 'Expanded Crop', icon: '🎒', category: 'gathering', prerequisites: ['efficient_crop'], researchTime: 60, description: '+50% carry capacity', effect: 'carryBonus:0.5' },
  { id: 'resource_sense', name: 'Resource Sense', icon: '🔍', category: 'gathering', prerequisites: ['faster_legs'], researchTime: 35, description: 'Better quality resources', effect: 'qualityBonus:0.2' },

  // Building
  { id: 'quick_build', name: 'Quick Build', icon: '🏗️', category: 'building', prerequisites: [], researchTime: 25, description: '+25% build speed', effect: 'buildSpeed:0.25' },
  { id: 'sturdy_walls', name: 'Sturdy Walls', icon: '🧱', category: 'building', prerequisites: ['quick_build'], researchTime: 45, description: '+30% build speed', effect: 'buildSpeed:0.3' },
  { id: 'advanced_architecture', name: 'Advanced Architecture', icon: '🏛️', category: 'building', prerequisites: ['sturdy_walls'], researchTime: 75, description: 'Unlock building upgrades', effect: 'maxBuildLevel:1' },

  // Evolution
  { id: 'ant_soldier', name: 'Soldier Evolution', icon: '🐜', category: 'evolution', prerequisites: ['sharp_mandibles'], researchTime: 60, description: 'Evolve to Soldier role', effect: 'role:soldier' },
  { id: 'ant_scout', name: 'Scout Evolution', icon: '🐜', category: 'evolution', prerequisites: ['faster_legs'], researchTime: 60, description: 'Evolve to Scout role', effect: 'role:scout' },
  { id: 'ant_builder', name: 'Builder Evolution', icon: '🐜', category: 'evolution', prerequisites: ['quick_build'], researchTime: 60, description: 'Evolve to Builder role', effect: 'role:builder' },
  { id: 'king_evolution', name: 'King Evolution', icon: '👑', category: 'evolution', prerequisites: ['ant_soldier', 'ant_scout', 'ant_builder'], researchTime: 180, description: 'Become the Colony King!', effect: 'role:king' },
]
