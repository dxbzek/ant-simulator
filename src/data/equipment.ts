import type { Rarity } from '../stores/inventoryStore'

export interface EquipmentDef {
  id: string
  name: string
  icon: string
  type: 'weapon' | 'armor' | 'helmet' | 'accessory'
  rarity: Rarity
  stats: {
    attack?: number
    defense?: number
    speed?: number
    hp?: number
    gatherRate?: number
  }
  description: string
  dropSource?: string
}

export const EQUIPMENT: EquipmentDef[] = [
  // Weapons
  { id: 'mandible_blade', name: 'Mandible Blade', icon: '🗡️', type: 'weapon', rarity: 'common', stats: { attack: 3 }, description: 'Basic mandible weapon.' },
  { id: 'spider_fang', name: 'Spider Fang Dagger', icon: '🗡️', type: 'weapon', rarity: 'common', stats: { attack: 5 }, description: 'A fang from a garden spider.', dropSource: 'spider' },
  { id: 'acid_sprayer', name: 'Acid Sprayer', icon: '🔫', type: 'weapon', rarity: 'uncommon', stats: { attack: 8 }, description: 'Sprays formic acid.' },
  { id: 'wasp_stinger', name: 'Wasp Stinger', icon: '🗡️', type: 'weapon', rarity: 'rare', stats: { attack: 15 }, description: 'A deadly wasp stinger.', dropSource: 'wasp' },
  { id: 'queens_fang', name: "Queen's Fang", icon: '⚔️', type: 'weapon', rarity: 'epic', stats: { attack: 25 }, description: 'Taken from the Spider Queen.', dropSource: 'boss_spider_queen' },
  { id: 'kings_horn', name: "King's Horn", icon: '⚔️', type: 'weapon', rarity: 'epic', stats: { attack: 20, defense: 10 }, description: 'The mighty horn of the Beetle King.', dropSource: 'boss_beetle_king' },
  { id: 'emperors_crown', name: "Emperor's Crown", icon: '👑', type: 'helmet', rarity: 'legendary', stats: { attack: 15, defense: 15, hp: 50 }, description: 'Crown of the Wasp Emperor.', dropSource: 'boss_wasp_emperor' },

  // Armor
  { id: 'leaf_armor', name: 'Leaf Armor', icon: '🛡️', type: 'armor', rarity: 'common', stats: { defense: 3 }, description: 'Armor woven from leaves.' },
  { id: 'beetle_shell', name: 'Beetle Shell Armor', icon: '🛡️', type: 'armor', rarity: 'uncommon', stats: { defense: 6 }, description: 'Hard beetle carapace.' },
  { id: 'chitin_plate', name: 'Chitin Plate', icon: '🛡️', type: 'armor', rarity: 'uncommon', stats: { defense: 8, speed: -1 }, description: 'Heavy chitin plating.' },
  { id: 'silk_armor', name: 'Spider Silk Armor', icon: '🛡️', type: 'armor', rarity: 'rare', stats: { defense: 10, speed: 2 }, description: 'Light yet strong silk armor.' },
  { id: 'obsidian_shell', name: 'Obsidian Shell', icon: '🛡️', type: 'armor', rarity: 'epic', stats: { defense: 18, hp: 25 }, description: 'Nearly impenetrable armor.' },

  // Helmets
  { id: 'twig_helmet', name: 'Twig Helmet', icon: '⛑️', type: 'helmet', rarity: 'common', stats: { defense: 2 }, description: 'Basic head protection.' },
  { id: 'mineral_helm', name: 'Mineral Helm', icon: '⛑️', type: 'helmet', rarity: 'uncommon', stats: { defense: 5, hp: 10 }, description: 'Reinforced with minerals.' },

  // Accessories
  { id: 'speed_boots', name: 'Pollen Boots', icon: '👟', type: 'accessory', rarity: 'common', stats: { speed: 2 }, description: 'Move faster through terrain.' },
  { id: 'honeydew', name: 'Honeydew Charm', icon: '🍯', type: 'accessory', rarity: 'common', stats: { hp: 15, gatherRate: 0.2 }, description: 'Sweet and nutritious.' },
  { id: 'wing_shard', name: 'Wing Shard Amulet', icon: '✨', type: 'accessory', rarity: 'rare', stats: { speed: 3, attack: 5 }, description: 'Shimmering dragonfly wing fragment.' },
  { id: 'golden_wings', name: 'Golden Wings', icon: '🦋', type: 'accessory', rarity: 'legendary', stats: { speed: 5, attack: 10, defense: 5 }, description: 'Legendary wings of gold.' },
]

export function getEquipmentById(id: string): EquipmentDef | undefined {
  return EQUIPMENT.find((e) => e.id === id)
}
