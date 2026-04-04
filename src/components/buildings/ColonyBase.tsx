import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useColonyStore, type PlacedBuilding } from '../../stores/colonyStore'
import { getTerrainHeightAt } from '../world/Terrain'
import { BUILDINGS } from '../../data/buildings'
import { useResearchStore } from '../../stores/researchStore'
import { RESEARCH_NODES } from '../../data/research'

const BUILDING_COLORS: Record<string, string> = {
  nest_entrance: '#8B4513',
  food_depot: '#D2691E',
  wood_pile: '#A0522D',
  mineral_cache: '#708090',
  barracks: '#B22222',
  watchtower: '#DAA520',
  research_lab: '#4169E1',
  nursery: '#FF69B4',
  queen_chamber: '#FFD700',
  bridge: '#8B7355',
}

function BuildingMesh({ building }: { building: PlacedBuilding }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const def = BUILDINGS.find((b) => b.id === building.type)
  const color = BUILDING_COLORS[building.type] || '#888888'

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Building construction animation
    if (!building.isComplete) {
      const progress = building.buildProgress
      meshRef.current.scale.y = 0.1 + progress * 0.9
      meshRef.current.material = meshRef.current.material as THREE.MeshStandardMaterial
      ;(meshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.4 + progress * 0.6

      // Auto-progress construction (with research speed bonus)
      let buildSpeedMult = 1
      const completed = useResearchStore.getState().completed
      for (const nodeId of completed) {
        const rn = RESEARCH_NODES.find(r => r.id === nodeId)
        if (rn?.effect?.startsWith('buildSpeed:')) {
          buildSpeedMult += parseFloat(rn.effect.split(':')[1]) || 0
        }
      }
      useColonyStore.getState().updateBuildProgress(
        building.id,
        building.buildProgress + (delta * buildSpeedMult) / (def?.buildTime || 10)
      )
    }
  })

  const terrainY = getTerrainHeightAt(building.x, building.z)
  const baseSize = 0.4 + building.level * 0.1
  const height = 0.3 + building.level * 0.15

  return (
    <group position={[building.x, terrainY, building.z]}>
      {/* Base platform */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[baseSize + 0.1, baseSize + 0.15, 0.04, 8]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>

      {/* Main structure */}
      <mesh ref={meshRef} position={[0, height / 2 + 0.04, 0]} castShadow>
        {building.type === 'watchtower' ? (
          <cylinderGeometry args={[baseSize * 0.3, baseSize * 0.5, height * 2, 6]} />
        ) : building.type === 'bridge' ? (
          <boxGeometry args={[baseSize * 3, height * 0.3, baseSize]} />
        ) : building.type === 'queen_chamber' ? (
          <sphereGeometry args={[baseSize * 0.8, 12, 8]} />
        ) : (
          <boxGeometry args={[baseSize, height, baseSize]} />
        )}
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          transparent={!building.isComplete}
          opacity={building.isComplete ? 1 : 0.5}
          emissive={color}
          emissiveIntensity={building.isComplete ? 0.05 : 0}
        />
      </mesh>

      {/* Level indicator */}
      {building.level > 1 && building.isComplete && (
        <mesh position={[0, height + 0.15, 0]}>
          <sphereGeometry args={[0.05, 6, 4]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  )
}

export default function ColonyBase() {
  const buildings = useColonyStore((s) => s.buildings)

  return (
    <group>
      {buildings.map((building) => (
        <BuildingMesh key={building.id} building={building} />
      ))}
    </group>
  )
}
