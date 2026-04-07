import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getTerrainHeightAt } from './Terrain'
import { fbm2D } from '../../utils/noise'

const GRASS_COUNT = 3000
const TALL_GRASS_COUNT = 400
const MUSHROOM_COUNT = 150
const ROCK_COUNT = 300
const FLOWER_COUNT = 200
const TREE_COUNT = 250

const _scratchColor = new THREE.Color()

function InstancedGrass() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!meshRef.current) return
    let placed = 0
    for (let i = 0; i < GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * 190
      const z = (Math.random() - 0.5) * 190
      const y = getTerrainHeightAt(x, z)
      if (y < -0.3) continue

      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise > 0.45) continue // skip cave

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const width = 0.05 + Math.random() * 0.08
      const height = 0.25 + Math.random() * 0.45
      dummy.scale.set(width, height, width)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(placed, dummy.matrix)

      if (biomeNoise < -0.3) _scratchColor.setHSL(0.1, 0.3, 0.55)
      else if (biomeNoise < -0.05) _scratchColor.setHSL(0.28, 0.5, 0.22)
      else if (biomeNoise < 0.2) _scratchColor.setHSL(0.3, 0.6, 0.35)
      else _scratchColor.setHSL(0.32, 0.7, 0.42)
      meshRef.current.setColorAt(placed, _scratchColor)
      placed++
    }
    meshRef.current.count = placed
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [dummy])

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

  useEffect(() => {
    if (!meshRef.current) return
    let placed = 0
    for (let i = 0; i < TALL_GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const y = getTerrainHeightAt(x, z)
      if (y < -0.2) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.3 || biomeNoise > 0.45) continue

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const height = 0.8 + Math.random() * 1.4
      dummy.scale.set(0.025, height, 0.025)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(placed, dummy.matrix)

      _scratchColor.setHSL(0.28 + Math.random() * 0.06, 0.5, 0.32)
      meshRef.current.setColorAt(placed, _scratchColor)
      placed++
    }
    meshRef.current.count = placed
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [dummy])

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

  useEffect(() => {
    if (!meshRef.current) return
    let placed = 0
    for (let i = 0; i < MUSHROOM_COUNT; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const y = getTerrainHeightAt(x, z)
      if (y < -0.2) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.3) continue

      const scale = 0.4 + Math.random() * 0.9
      dummy.position.set(x, y + scale * 0.15, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.scale.set(scale * 0.6, scale * 0.5, scale * 0.6)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(placed, dummy.matrix)

      _scratchColor.setHSL(Math.random() * 0.1, 0.6, 0.5)
      meshRef.current.setColorAt(placed, _scratchColor)
      placed++
    }
    meshRef.current.count = placed
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [dummy])

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

  useEffect(() => {
    if (!meshRef.current) return
    let placed = 0
    for (let i = 0; i < ROCK_COUNT; i++) {
      const x = (Math.random() - 0.5) * 190
      const z = (Math.random() - 0.5) * 190
      const y = getTerrainHeightAt(x, z)

      const scale = 0.08 + Math.random() * 0.45
      dummy.position.set(x, y + scale * 0.1, z)
      dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.3)
      dummy.scale.set(scale, scale * (0.4 + Math.random() * 0.4), scale * (0.7 + Math.random() * 0.5))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(placed, dummy.matrix)

      const gray = 0.35 + Math.random() * 0.3
      _scratchColor.setRGB(gray, gray, gray * 0.95)
      meshRef.current.setColorAt(placed, _scratchColor)
      placed++
    }
    meshRef.current.count = placed
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [dummy])

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

  useEffect(() => {
    if (!meshRef.current) return
    let placed = 0
    for (let i = 0; i < FLOWER_COUNT; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const y = getTerrainHeightAt(x, z)
      if (y < 0) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      if (biomeNoise < -0.05 || biomeNoise > 0.45) continue

      const height = 0.5 + Math.random() * 0.8
      dummy.position.set(x, y + height * 0.5, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.scale.set(0.12, height, 0.12)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(placed, dummy.matrix)

      // Colorful flowers: random hue for petals
      const hue = Math.random()
      _scratchColor.setHSL(hue, 0.8, 0.6)
      meshRef.current.setColorAt(placed, _scratchColor)
      placed++
    }
    meshRef.current.count = placed
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [dummy])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FLOWER_COUNT]} castShadow={false} frustumCulled>
      <cylinderGeometry args={[1, 1.2, 1, 5]} />
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

function Trees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const canopyRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return
    let placed = 0
    for (let i = 0; i < TREE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 190
      const z = (Math.random() - 0.5) * 190
      const y = getTerrainHeightAt(x, z)
      if (y < -0.1) continue
      const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
      // Trees in forest, garden, swamp (not desert, not cave)
      if (biomeNoise < -0.05 || biomeNoise > 0.45) continue

      const trunkH = 1.5 + Math.random() * 3.5
      const trunkR = 0.15 + Math.random() * 0.25
      const canopyR = 1.0 + Math.random() * 2.2

      // Trunk
      dummy.position.set(x, y + trunkH * 0.5, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.scale.set(trunkR, trunkH, trunkR)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(placed, dummy.matrix)

      const brown = 0.25 + Math.random() * 0.15
      _scratchColor.setRGB(brown * 0.7, brown * 0.45, brown * 0.25)
      trunkRef.current.setColorAt(placed, _scratchColor)

      // Canopy
      dummy.position.set(x, y + trunkH + canopyR * 0.5, z)
      dummy.scale.set(canopyR, canopyR * 0.8, canopyR)
      dummy.updateMatrix()
      canopyRef.current.setMatrixAt(placed, dummy.matrix)

      if (biomeNoise < 0.2) _scratchColor.setHSL(0.3, 0.6, 0.28) // forest: darker green
      else _scratchColor.setHSL(0.33, 0.65, 0.35) // garden: brighter green
      canopyRef.current.setColorAt(placed, _scratchColor)

      placed++
    }
    trunkRef.current.count = placed
    canopyRef.current.count = placed
    trunkRef.current.instanceMatrix.needsUpdate = true
    canopyRef.current.instanceMatrix.needsUpdate = true
    if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true
    if (canopyRef.current.instanceColor) canopyRef.current.instanceColor.needsUpdate = true
  }, [dummy])

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, TREE_COUNT]} castShadow frustumCulled>
        <cylinderGeometry args={[1, 1.3, 1, 6]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, TREE_COUNT]} castShadow frustumCulled>
        <dodecahedronGeometry args={[1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </>
  )
}

export default function Vegetation() {
  return (
    <group>
      <Trees />
      <InstancedGrass />
      <TallGrass />
      <InstancedMushrooms />
      <InstancedRocks />
      <InstancedFlowers />
    </group>
  )
}
