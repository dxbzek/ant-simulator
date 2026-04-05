import type { Rarity, Resources } from '../stores/inventoryStore'

export interface Recipe {
  id: string
  name: string
  icon: string
  category: 'equipment' | 'consumable' | 'building' | 'furniture'
  rarity: Rarity
  cost: Partial<Resources>
  craftTime: number // seconds
  result: string // item ID or effect
  description: string
}

export const RECIPES: Recipe[] = [
  // Equipment
  {
    id: 'craft_mandible_blade', name: 'Mandible Blade', icon: '🗡️',
    category: 'equipment', rarity: 'common',
    cost: { minerals: 5, wood: 3 }, craftTime: 10,
    result: 'mandible_blade', description: 'A basic melee weapon.',
  },
  {
    id: 'craft_leaf_armor', name: 'Leaf Armor', icon: '🛡️',
    category: 'equipment', rarity: 'common',
    cost: { leaves: 10, wood: 5 }, craftTime: 15,
    result: 'leaf_armor', description: 'Basic protective armor.',
  },
  {
    id: 'craft_twig_helmet', name: 'Twig Helmet', icon: '⛑️',
    category: 'equipment', rarity: 'common',
    cost: { wood: 8, leaves: 3 }, craftTime: 8,
    result: 'twig_helmet', description: 'Simple head protection.',
  },
  {
    id: 'craft_speed_boots', name: 'Pollen Boots', icon: '👟',
    category: 'equipment', rarity: 'common',
    cost: { leaves: 8, food: 5 }, craftTime: 12,
    result: 'speed_boots', description: 'Boots that increase movement speed.',
  },
  {
    id: 'craft_acid_sprayer', name: 'Acid Sprayer', icon: '🔫',
    category: 'equipment', rarity: 'uncommon',
    cost: { minerals: 15, water: 10, wood: 8 }, craftTime: 25,
    result: 'acid_sprayer', description: 'Ranged acid weapon.',
  },

  {
    id: 'craft_mineral_helm', name: 'Mineral Helm', icon: '⛑️',
    category: 'equipment', rarity: 'uncommon',
    cost: { minerals: 12, wood: 5 }, craftTime: 18,
    result: 'mineral_helm', description: 'Reinforced helmet with mineral plating.',
  },

  // Consumables
  {
    id: 'craft_heal_berry', name: 'Heal Berry', icon: '🫐',
    category: 'consumable', rarity: 'common',
    cost: { food: 5, water: 3 }, craftTime: 5,
    result: 'heal_berry', description: 'Restores 30 HP.',
  },
  {
    id: 'craft_stamina_nectar', name: 'Stamina Nectar', icon: '🍹',
    category: 'consumable', rarity: 'common',
    cost: { food: 3, water: 5, leaves: 2 }, craftTime: 5,
    result: 'stamina_nectar', description: 'Fully restores stamina.',
  },
  {
    id: 'craft_attack_pheromone', name: 'Attack Pheromone', icon: '💪',
    category: 'consumable', rarity: 'uncommon',
    cost: { food: 10, minerals: 5 }, craftTime: 15,
    result: 'attack_pheromone', description: '+50% attack for 60 seconds.',
  },
  {
    id: 'craft_defense_resin', name: 'Defense Resin', icon: '🧴',
    category: 'consumable', rarity: 'uncommon',
    cost: { wood: 10, minerals: 8 }, craftTime: 15,
    result: 'defense_resin', description: '+50% defense for 60 seconds.',
  },
]
