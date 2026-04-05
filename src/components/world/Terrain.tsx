import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fbm2D } from '../../utils/noise'

const CHUNK_SIZE = 64
const CHUNK_SEGMENTS = 32
const RENDER_DISTANCE = 1 // chunks in each direction

// Terrain height cache for O(1) repeated lookups
const _heightCache = new Map<string, number>()
const CACHE_RESOLUTION = 4 // quantization: 0.25 unit grid
const MAX_CACHE_SIZE = 8000

// Global terrain height function used by movement and other systems
export function getTerrainHeightAt(x: number, z: number): number {
  const kx = Math.round(x * CACHE_RESOLUTION)
  const kz = Math.round(z * CACHE_RESOLUTION)
  const key = `${kx}:${kz}`

  const cached = _heightCache.get(key)
  if (cached !== undefined) return cached

  const scale = 0.015
  const height = fbm2D(x * scale, z * scale, 5, 2, 0.5) * 8
  const detail = fbm2D(x * 0.05, z * 0.05, 3, 2, 0.5) * 2
  const result = height + detail

  // Evict old entries if cache is too large
  if (_heightCache.size > MAX_CACHE_SIZE) {
    const iter = _heightCache.keys()
    for (let i = 0; i < 2000; i++) {
      const k = iter.next()
      if (k.done) break
      _heightCache.delete(k.value)
    }
  }

  _heightCache.set(key, result)
  return result
}

// Get biome-tinted color for terrain at position
const _tmpColor1 = new THREE.Color()
const _tmpColor2 = new THREE.Color()

function getTerrainColor(x: number, z: number, height: number): THREE.Color {
  const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)

  if (biomeNoise < -0.3) {
    _tmpColor1.setRGB(0.76, 0.64, 0.4)
    _tmpColor2.setRGB(0.83, 0.72, 0.47)
    return _tmpColor1.lerp(_tmpColor2, Math.abs(fbm2D(x * 0.1, z * 0.1, 2)) * 0.5)
  } else if (biomeNoise < -0.05) {
    _tmpColor1.setRGB(0.18, 0.29, 0.18)
    _tmpColor2.setRGB(0.29, 0.42, 0.23)
    return _tmpColor1.lerp(_tmpColor2, Math.abs(fbm2D(x * 0.08, z * 0.08, 2)) * 0.5)
  } else if (biomeNoise < 0.2) {
    _tmpColor1.setRGB(0.18, 0.35, 0.12)
    _tmpColor2.setRGB(0.29, 0.49, 0.18)
    return _tmpColor1.lerp(_tmpColor2, height * 0.05 + 0.3)
  } else if (biomeNoise < 0.45) {
    _tmpColor1.setRGB(0.29, 0.55, 0.25)
    _tmpColor2.setRGB(0.42, 0.69, 0.3)
    return _tmpColor1.lerp(_tmpColor2, Math.abs(fbm2D(x * 0.06, z * 0.06, 2)) * 0.6)
  } else {
    _tmpColor1.setRGB(0.24, 0.24, 0.24)
    _tmpColor2.setRGB(0.35, 0.35, 0.35)
    return _tmpColor1.lerp(_tmpColor2, height * 0.03 + 0.5)
  }
}

function TerrainChunk({ chunkX, chunkZ }: { chunkX: number; chunkZ: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS)
    geo.rotateX(-Math.PI / 2)

    const positions = geo.attributes.position
    const colors = new Float32Array(positions.count * 3)
    const color = new THREE.Color()

    const worldOffsetX = chunkX * CHUNK_SIZE
    const worldOffsetZ = chunkZ * CHUNK_SIZE

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + worldOffsetX
      const z = positions.getZ(i) + worldOffsetZ
      const y = getTerrainHeightAt(x, z)
      positions.setY(i, y)

      const c = getTerrainColor(x, z, y)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [chunkX, chunkZ])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE]}
      receiveShadow
    >
      <meshLambertMaterial vertexColors side={THREE.FrontSide} />
    </mesh>
  )
}

export default function Terrain() {
  const [playerChunk, setPlayerChunk] = useState({ x: 0, z: 0 })

  useFrame(({ camera }) => {
    const cx = Math.floor(camera.position.x / CHUNK_SIZE)
    const cz = Math.floor(camera.position.z / CHUNK_SIZE)
    if (cx !== playerChunk.x || cz !== playerChunk.z) {
      setPlayerChunk({ x: cx, z: cz })
    }
  })

  const chunks = useMemo(() => {
    const result: { x: number; z: number }[] = []
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        result.push({ x: playerChunk.x + dx, z: playerChunk.z + dz })
      }
    }
    return result
  }, [playerChunk.x, playerChunk.z])

  return (
    <group>
      {chunks.map(({ x, z }) => (
        <TerrainChunk key={`${x}_${z}`} chunkX={x} chunkZ={z} />
      ))}
    </group>
  )
}
