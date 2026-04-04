import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getTerrainHeightAt } from './Terrain'
import { fbm2D } from '../../utils/noise'

const GRASS_COUNT = 5000
const TALL_GRASS_COUNT = 800
const MUSHROOM_COUNT = 150
const ROCK_COUNT = 400
const PEBBLE_COUNT = 600
const FLOWER_COUNT = 200
const TWIG_COUNT = 200

// Grass blades - the main ground cover
function InstancedGrass() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200
      const y = getTerrainHeightAt(x, z)
      if (y < -0.3) continue

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.15)
      // Ant-scale grass: tall relative to ant
      const height = 0.15 + Math.random() * 0.25
      dummy.scale.set(0.03 + Math.random() * 0.02, height, 0.03 + Math.random() * 0.02)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      const color = new THREE.Color()
      if (biomeNoise < -0.3) {
        color.setHSL(0.1 + Math.random() * 0.05, 0.3, 0.5 + Math.random() * 0.15) // desert yellow
      } else if (biomeNoise < -0.05) {
        color.setHSL(0.28 + Math.random() * 0.04, 0.5, 0.2 + Math.random() * 0.1) // swamp dark
      } else if (biomeNoise < 0.2) {
        color.setHSL(0.3 + Math.random() * 0.05, 0.6, 0.3 + Math.random() * 0.15) // forest
      } else if (biomeNoise < 0.45) {
        color.setHSL(0.32 + Math.random() * 0.05, 0.7, 0.35 + Math.random() * 0.15) // garden
      } else {
        continue // no grass in cave
      }
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.5) * 0.02
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GRASS_COUNT]} castShadow>
      <coneGeometry args={[1, 1, 3]} />
      <meshStandardMaterial vertexColors roughness={0.8} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

// Tall grass blades - towering from ant perspective
function TallGrass() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < TALL_GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const y = getTerrainHeightAt(x, z)
      if (y < -0.2) continue

      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.3 || biomeNoise > 0.45) continue // no tall grass in desert/cave

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.1)
      const height = 0.6 + Math.random() * 1.2 // towering grass blades
      dummy.scale.set(0.015 + Math.random() * 0.01, height, 0.015 + Math.random() * 0.01)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      color.setHSL(0.28 + Math.random() * 0.08, 0.5 + Math.random() * 0.2, 0.3 + Math.random() * 0.2)
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TALL_GRASS_COUNT]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

// Mushrooms - enormous from ant POV
function InstancedMushrooms() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const stemRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current || !stemRef.current) return
    for (let i = 0; i < MUSHROOM_COUNT; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const y = getTerrainHeightAt(x, z)
      if (y < -0.2) continue

      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.3) continue // no mushrooms in desert

      const rot = Math.random() * Math.PI * 2
      const scale = 0.3 + Math.random() * 0.8 // big relative to ant

      // Cap
      dummy.position.set(x, y + scale * 0.35, z)
      dummy.rotation.set(0, rot, 0)
      dummy.scale.set(scale * 0.5, scale * 0.15, scale * 0.5)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Stem
      dummy.position.set(x, y + scale * 0.15, z)
      dummy.scale.set(scale * 0.12, scale * 0.3, scale * 0.12)
      dummy.updateMatrix()
      stemRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      const hue = Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? 0.08 : 0.05
      color.setHSL(hue, 0.5 + Math.random() * 0.3, 0.45 + Math.random() * 0.25)
      meshRef.current.setColorAt(i, color)
      stemRef.current.setColorAt(i, new THREE.Color(0.9, 0.85, 0.75))
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    stemRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    if (stemRef.current.instanceColor) stemRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MUSHROOM_COUNT]} castShadow>
        <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={stemRef} args={[undefined, undefined, MUSHROOM_COUNT]} castShadow>
        <cylinderGeometry args={[1, 1.1, 1, 6]} />
        <meshStandardMaterial vertexColors roughness={0.8} />
      </instancedMesh>
    </>
  )
}

// Rocks - pebbles and small stones (huge relative to ant)
function InstancedRocks() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < ROCK_COUNT; i++) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200
      const y = getTerrainHeightAt(x, z)

      dummy.position.set(x, y + 0.01, z)
      dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.3)
      const scale = 0.05 + Math.random() * 0.2
      dummy.scale.set(scale * (0.8 + Math.random() * 0.5), scale * (0.4 + Math.random() * 0.3), scale * (0.8 + Math.random() * 0.5))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const gray = 0.35 + Math.random() * 0.35
      const tint = Math.random() * 0.05
      meshRef.current.setColorAt(i, new THREE.Color(gray - tint, gray, gray - tint * 0.5))
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ROCK_COUNT]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial vertexColors roughness={0.95} />
    </instancedMesh>
  )
}

// Tiny pebbles scattered everywhere
function Pebbles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < PEBBLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200
      const y = getTerrainHeightAt(x, z)

      dummy.position.set(x, y + 0.005, z)
      dummy.rotation.set(Math.random(), Math.random() * Math.PI * 2, Math.random())
      const scale = 0.01 + Math.random() * 0.04
      dummy.scale.set(scale, scale * 0.5, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const gray = 0.4 + Math.random() * 0.3
      meshRef.current.setColorAt(i, new THREE.Color(gray, gray * 0.95, gray * 0.9))
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PEBBLE_COUNT]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshStandardMaterial vertexColors roughness={0.95} />
    </instancedMesh>
  )
}

// Flowers - towering from ant perspective
function InstancedFlowers() {
  const stemRef = useRef<THREE.InstancedMesh>(null)
  const petalRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!stemRef.current || !petalRef.current) return
    for (let i = 0; i < FLOWER_COUNT; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const y = getTerrainHeightAt(x, z)
      if (y < 0) continue

      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.05 || biomeNoise > 0.45) continue

      const height = 0.8 + Math.random() * 1.5 // very tall for an ant

      // Stem
      dummy.position.set(x, y + height * 0.5, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.08)
      dummy.scale.set(0.015, height, 0.015)
      dummy.updateMatrix()
      stemRef.current.setMatrixAt(i, dummy.matrix)
      stemRef.current.setColorAt(i, new THREE.Color(0.2, 0.5, 0.15))

      // Flower head
      dummy.position.set(x, y + height, z)
      dummy.scale.set(0.08 + Math.random() * 0.06, 0.04, 0.08 + Math.random() * 0.06)
      dummy.updateMatrix()
      petalRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      color.setHSL(Math.random(), 0.7 + Math.random() * 0.3, 0.5 + Math.random() * 0.2)
      petalRef.current.setColorAt(i, color)
    }
    stemRef.current.instanceMatrix.needsUpdate = true
    petalRef.current.instanceMatrix.needsUpdate = true
    if (stemRef.current.instanceColor) stemRef.current.instanceColor.needsUpdate = true
    if (petalRef.current.instanceColor) petalRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <>
      <instancedMesh ref={stemRef} args={[undefined, undefined, FLOWER_COUNT]} castShadow>
        <cylinderGeometry args={[1, 1.2, 1, 4]} />
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={petalRef} args={[undefined, undefined, FLOWER_COUNT]} castShadow>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial vertexColors roughness={0.4} emissive="#221111" emissiveIntensity={0.1} />
      </instancedMesh>
    </>
  )
}

// Twigs - scattered on the ground
function Twigs() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < TWIG_COUNT; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const y = getTerrainHeightAt(x, z)
      if (y < -0.2) continue

      dummy.position.set(x, y + 0.01, z)
      dummy.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.3, Math.random() * Math.PI * 2, 0)
      const len = 0.15 + Math.random() * 0.3
      dummy.scale.set(0.008 + Math.random() * 0.005, len, 0.008 + Math.random() * 0.005)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const brown = 0.25 + Math.random() * 0.2
      meshRef.current.setColorAt(i, new THREE.Color(brown + 0.1, brown, brown - 0.05))
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TWIG_COUNT]}>
      <cylinderGeometry args={[1, 0.7, 1, 4]} />
      <meshStandardMaterial vertexColors roughness={0.9} />
    </instancedMesh>
  )
}

export default function Vegetation() {
  return (
    <group>
      <InstancedGrass />
      <TallGrass />
      <InstancedMushrooms />
      <InstancedRocks />
      <Pebbles />
      <InstancedFlowers />
      <Twigs />
    </group>
  )
}
