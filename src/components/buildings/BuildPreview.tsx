import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerStore } from '../../stores/playerStore'
import { useGameStore } from '../../stores/gameStore'
import { getTerrainHeightAt } from '../world/Terrain'

const previewMat = new THREE.MeshLambertMaterial({
  color: '#44aaff',
  transparent: true,
  opacity: 0.35,
  emissive: new THREE.Color('#2266ff'),
  emissiveIntensity: 0.3,
})

const invalidMat = new THREE.MeshLambertMaterial({
  color: '#ff4444',
  transparent: true,
  opacity: 0.35,
  emissive: new THREE.Color('#ff2222'),
  emissiveIntensity: 0.3,
})

export default function BuildPreview() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    const screen = useGameStore.getState().screen
    if (screen !== 'buildMenu') {
      groupRef.current.visible = false
      return
    }

    groupRef.current.visible = true
    const player = usePlayerStore.getState()
    const x = player.positionX + Math.sin(player.rotationY) * -3
    const z = player.positionZ + Math.cos(player.rotationY) * -3
    const y = getTerrainHeightAt(x, z)
    groupRef.current.position.set(x, y + 0.2, z)
    groupRef.current.rotation.y += 0.01
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Ghost building indicator */}
      <mesh material={previewMat}>
        <cylinderGeometry args={[0.3, 0.4, 0.5, 8]} />
      </mesh>
      {/* Ground ring */}
      <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.6, 16]} />
        <meshBasicMaterial color="#44aaff" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
