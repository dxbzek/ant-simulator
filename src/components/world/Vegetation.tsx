import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getTerrainHeightAt } from './Terrain'
import { fbm2D } from '../../utils/noise'

// Reduced counts for performance - all use instanced rendering
const GRASS_COUNT = 2000
const TALL_GRASS_COUNT = 300
const MUSHROOM_COUNT = 80
const ROCK_COUNT = 200
const FLOWER_COUNT = 80

function InstancedGrass() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const y = getTerrainHeightAt(x, z)
      if (y < -0.3) continue

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const height = 0.15 + Math.random() * 0.25
      dummy.scale.set(0.03, height, 0.03)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      const color = new THREE.Color()
      if (biomeNoise < -0.3) color.setHSL(0.1, 0.3, 0.55)
      else if (biomeNoise < -0.05) color.setHSL(0.28, 0.5, 0.22)
      else if (biomeNoise < 0.2) color.setHSL(0.3, 0.6, 0.35)
      else if (biomeNoise < 0.45) color.setHSL(0.32, 0.7, 0.4)
      else continue
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GRASS_COUNT]} castShadow={false} frustumCulled>
      <coneGeometry args={[1, 1, 3]} />
      <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

function TallGrass() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < TALL_GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * 150
      const z = (Math.random() - 0.5) * 150
      const y = getTerrainHeightAt(x, z)
      if (y < -0.2) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.3 || biomeNoise > 0.45) continue

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const height = 0.6 + Math.random() * 1.0
      dummy.scale.set(0.015, height, 0.015)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      color.setHSL(0.28 + Math.random() * 0.06, 0.5, 0.32)
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TALL_GRASS_COUNT]} castShadow={false} frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

function InstancedMushrooms() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < MUSHROOM_COUNT; i++) {
      const x = (Math.random() - 0.5) * 140
      const z = (Math.random() - 0.5) * 140
      const y = getTerrainHeightAt(x, z)
      if (y < -0.2) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.3) continue

      const scale = 0.3 + Math.random() * 0.6
      dummy.position.set(x, y + scale * 0.2, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.scale.set(scale * 0.4, scale * 0.35, scale * 0.4)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      color.setHSL(Math.random() * 0.1, 0.5, 0.5)
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MUSHROOM_COUNT]} castShadow={false} frustumCulled>
      <sphereGeometry args={[1, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

function InstancedRocks() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < ROCK_COUNT; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const y = getTerrainHeightAt(x, z)

      dummy.position.set(x, y + 0.01, z)
      dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.3)
      const scale = 0.03 + Math.random() * 0.12
      dummy.scale.set(scale, scale * 0.5, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const gray = 0.35 + Math.random() * 0.3
      meshRef.current.setColorAt(i, new THREE.Color(gray, gray, gray * 0.95))
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ROCK_COUNT]} frustumCulled>
      <dodecahedronGeometry args={[1, 0]} />
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

function InstancedFlowers() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < FLOWER_COUNT; i++) {
      const x = (Math.random() - 0.5) * 140
      const z = (Math.random() - 0.5) * 140
      const y = getTerrainHeightAt(x, z)
      if (y < 0) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.05 || biomeNoise > 0.45) continue

      const height = 0.8 + Math.random() * 1.2
      dummy.position.set(x, y + height * 0.5, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.scale.set(0.015, height, 0.015)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color()
      color.setHSL(0.3, 0.5, 0.3)
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FLOWER_COUNT]} castShadow={false} frustumCulled>
      <cylinderGeometry args={[1, 1.2, 1, 3]} />
      <meshLambertMaterial vertexColors />
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
      <InstancedFlowers />
    </group>
  )
}
