import React, { useRef, useMemo } from 'react'
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

// Cache research build speed multiplier
const RESEARCH_NODE_MAP = new Map(RESEARCH_NODES.map(n => [n.id, n]))
let _cachedBuildSpeed = 1
useResearchStore.subscribe((state) => {
  let mult = 1
  for (const nodeId of state.completed) {
    const rn = RESEARCH_NODE_MAP.get(nodeId)
    if (rn?.effect?.startsWith('buildSpeed:')) {
      mult += parseFloat(rn.effect.split(':')[1]) || 0
    }
  }
  _cachedBuildSpeed = mult
})
// Init
{
  const completed = useResearchStore.getState().completed
  for (const nodeId of completed) {
    const rn = RESEARCH_NODE_MAP.get(nodeId)
    if (rn?.effect?.startsWith('buildSpeed:')) {
      _cachedBuildSpeed += parseFloat(rn.effect.split(':')[1]) || 0
    }
  }
}

// Shared materials
const basePlatformMat = new THREE.MeshLambertMaterial({ color: '#555555' })
const levelIndicatorMat = new THREE.MeshLambertMaterial({ color: '#FFD700', emissive: new THREE.Color('#FFD700'), emissiveIntensity: 0.5 })
const detailMat = new THREE.MeshLambertMaterial({ color: '#6b3410' })

// Shared geometries
const baseGeo = new THREE.CylinderGeometry(1, 1.05, 0.04, 8)
const levelGeo = new THREE.SphereGeometry(0.05, 6, 4)

function BuildingMesh({ building, meshRef }: { building: PlacedBuilding; meshRef?: React.RefObject<THREE.Mesh> }) {
  const localRef = useRef<THREE.Mesh>(null)
  const ref = meshRef || localRef
  const def = BUILDINGS.find((b) => b.id === building.type)
  const color = BUILDING_COLORS[building.type] || '#888888'

  const buildingMat = useMemo(() =>
    new THREE.MeshLambertMaterial({
      color,
      transparent: !building.isComplete,
      opacity: building.isComplete ? 1 : 0.5,
      emissive: new THREE.Color(color),
      emissiveIntensity: building.isComplete ? 0.05 : 0,
    }), [color, building.isComplete])

  const terrainY = getTerrainHeightAt(building.x, building.z)
  const baseSize = 0.4 + building.level * 0.1
  const height = 0.3 + building.level * 0.15

  return (
    <group position={[building.x, terrainY, building.z]}>
      {/* Base platform */}
      <mesh position={[0, 0.02, 0]} geometry={baseGeo}
        material={basePlatformMat} scale={[baseSize + 0.1, 1, baseSize + 0.1]} />

      {/* Main structure - distinctive shapes per building type */}
      <mesh ref={meshRef} position={[0, height / 2 + 0.04, 0]} castShadow material={buildingMat}>
        {building.type === 'nest_entrance' ? (
          // Layered ant mound
          <coneGeometry args={[baseSize * 0.8, height * 1.5, 8]} />
        ) : building.type === 'watchtower' ? (
          // Tapered tower
          <cylinderGeometry args={[baseSize * 0.2, baseSize * 0.5, height * 2.5, 6]} />
        ) : building.type === 'bridge' ? (
          <boxGeometry args={[baseSize * 3, height * 0.3, baseSize]} />
        ) : building.type === 'queen_chamber' ? (
          // Larger dome
          <sphereGeometry args={[baseSize * 0.9, 12, 8]} />
        ) : building.type === 'research_lab' ? (
          // Hexagonal prism
          <cylinderGeometry args={[baseSize * 0.5, baseSize * 0.5, height * 1.2, 6]} />
        ) : building.type === 'nursery' ? (
          // Rounded dome
          <sphereGeometry args={[baseSize * 0.6, 10, 6]} />
        ) : building.type === 'barracks' ? (
          // Wider fortified box
          <boxGeometry args={[baseSize * 1.2, height * 0.8, baseSize * 1.2]} />
        ) : building.type === 'food_depot' ? (
          // Barrel shape
          <cylinderGeometry args={[baseSize * 0.4, baseSize * 0.5, height * 1.2, 8]} />
        ) : (
          <boxGeometry args={[baseSize, height, baseSize]} />
        )}
      </mesh>

      {/* Watchtower observation deck */}
      {building.type === 'watchtower' && building.isComplete && (
        <mesh position={[0, height * 2.5 + 0.04, 0]} material={buildingMat}>
          <cylinderGeometry args={[baseSize * 0.45, baseSize * 0.4, 0.06, 8]} />
        </mesh>
      )}

      {/* Nest entrance rings */}
      {building.type === 'nest_entrance' && building.isComplete && (
        <>
          <mesh position={[0, height * 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={detailMat}>
            <torusGeometry args={[baseSize * 0.5, 0.03, 6, 12]} />
          </mesh>
          <mesh position={[0, height * 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} material={detailMat}>
            <torusGeometry args={[baseSize * 0.35, 0.025, 6, 12]} />
          </mesh>
        </>
      )}

      {/* Level indicator */}
      {building.level > 1 && building.isComplete && (
        <mesh position={[0, height + 0.15, 0]} geometry={levelGeo} material={levelIndicatorMat} />
      )}
    </group>
  )
}

// Map of mesh refs for construction animation — keyed by building id
const buildingMeshRefs = new Map<string, React.RefObject<THREE.Mesh>>()

export default function ColonyBase() {
  const buildings = useColonyStore((s) => s.buildings)

  // Single consolidated useFrame for all building construction
  useFrame((_, delta) => {
    const colony = useColonyStore.getState()
    for (const building of colony.buildings) {
      if (building.isComplete) continue
      const def = BUILDINGS.find(b => b.id === building.type)
      if (!def) continue

      colony.updateBuildProgress(
        building.id,
        building.buildProgress + (delta * _cachedBuildSpeed) / def.buildTime
      )

      const meshRef = buildingMeshRefs.get(building.id)
      if (meshRef?.current) {
        meshRef.current.scale.y = 0.1 + building.buildProgress * 0.9
        ;(meshRef.current.material as THREE.MeshLambertMaterial).opacity = 0.4 + building.buildProgress * 0.6
      }
    }
  })

  return (
    <group>
      {buildings.map((building) => {
        if (!buildingMeshRefs.has(building.id)) {
          buildingMeshRefs.set(building.id, { current: null } as unknown as React.RefObject<THREE.Mesh>)
        }
        return (
          <BuildingMesh
            key={building.id}
            building={building}
            meshRef={!building.isComplete ? buildingMeshRefs.get(building.id) : undefined}
          />
        )
      })}
    </group>
  )
}
