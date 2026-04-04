import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getTerrainHeightAt } from './Terrain'
import { fbm2D } from '../../utils/noise'

const GRASS_COUNT = 3000
const MUSHROOM_COUNT = 200
const ROCK_COUNT = 300
const FLOWER_COUNT = 150

function InstancedGrass() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200
      const y = getTerrainHeightAt(x, z)

      // Skip if underwater
      if (y < -0.3) continue

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const scale = 0.3 + Math.random() * 0.5
      dummy.scale.set(scale * 0.3, scale, scale * 0.3)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Biome-based coloring
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      const color = new THREE.Color()
      if (biomeNoise < -0.3) {
        color.set(0.7, 0.6, 0.3) // desert
      } else if (biomeNoise < -0.05) {
        color.set(0.15, 0.35, 0.15) // swamp - dark
      } else if (biomeNoise < 0.2) {
        color.set(0.2, 0.5 + Math.random() * 0.2, 0.15) // forest
      } else if (biomeNoise < 0.45) {
        color.set(0.3, 0.6 + Math.random() * 0.2, 0.2) // garden
      } else {
        continue // skip grass in cave
      }
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // Very subtle wind sway via shader would be ideal, but
    // for simplicity just do a slight mesh rotation
    meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 2) * 0.03
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GRASS_COUNT]} castShadow>
      <coneGeometry args={[0.06, 0.4, 4]} />
      <meshStandardMaterial vertexColors roughness={0.8} />
    </instancedMesh>
  )
}

function InstancedMushrooms() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < MUSHROOM_COUNT; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const y = getTerrainHeightAt(x, z)

      if (y < -0.2) continue

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const scale = 0.3 + Math.random() * 0.6
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      color.setHSL(0 + Math.random() * 0.1, 0.6, 0.4 + Math.random() * 0.2)
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MUSHROOM_COUNT]} castShadow>
      <sphereGeometry args={[0.15, 8, 6]} />
      <meshStandardMaterial vertexColors roughness={0.7} />
    </instancedMesh>
  )
}

function InstancedRocks() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < ROCK_COUNT; i++) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200
      const y = getTerrainHeightAt(x, z)

      dummy.position.set(x, y, z)
      dummy.rotation.set(Math.random(), Math.random() * Math.PI * 2, Math.random() * 0.3)
      const scale = 0.2 + Math.random() * 0.8
      dummy.scale.set(scale * (0.8 + Math.random() * 0.4), scale * 0.6, scale * (0.8 + Math.random() * 0.4))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const gray = 0.3 + Math.random() * 0.3
      meshRef.current.setColorAt(i, new THREE.Color(gray, gray, gray * 0.9))
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ROCK_COUNT]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial vertexColors roughness={0.95} />
    </instancedMesh>
  )
}

function InstancedFlowers() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < FLOWER_COUNT; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const y = getTerrainHeightAt(x, z)

      if (y < 0) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < 0 || biomeNoise > 0.45) continue // only in forest/garden

      dummy.position.set(x, y + 0.15, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const scale = 0.15 + Math.random() * 0.2
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      color.setHSL(Math.random(), 0.8, 0.6)
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FLOWER_COUNT]}>
      <sphereGeometry args={[0.08, 6, 4]} />
      <meshStandardMaterial vertexColors roughness={0.5} emissive="#331111" emissiveIntensity={0.1} />
    </instancedMesh>
  )
}

export default function Vegetation() {
  return (
    <group>
      <InstancedGrass />
      <InstancedMushrooms />
      <InstancedRocks />
      <InstancedFlowers />
    </group>
  )
}
