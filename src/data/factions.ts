export interface FactionDef {
  id: string
  name: string
  icon: string
  aggression: number // 0-1, how likely to attack
  baseRelation: number // starting relationship
  territory: { x: number; z: number; radius: number }
  color: string
}

export const FACTIONS: FactionDef[] = [
  {
    id: 'fire_ants',
    name: 'Fire Ant Legion',
    icon: '🔥',
    aggression: 0.8,
    baseRelation: -30,
    territory: { x: 80, z: 80, radius: 40 },
    color: '#dc2626',
  },
  {
    id: 'army_ants',
    name: 'Army Ant Horde',
    icon: '⚔️',
    aggression: 0.9,
    baseRelation: -50,
    territory: { x: -80, z: 80, radius: 40 },
    color: '#991b1b',
  },
  {
    id: 'leafcutter',
    name: 'Leafcutter Clan',
    icon: '🍃',
    aggression: 0.3,
    baseRelation: 20,
    territory: { x: 80, z: -80, radius: 40 },
    color: '#16a34a',
  },
  {
    id: 'bullet_ants',
    name: 'Bullet Ant Empire',
    icon: '💥',
    aggression: 0.7,
    baseRelation: -10,
    territory: { x: -80, z: -80, radius: 40 },
    color: '#854d0e',
  },
]
