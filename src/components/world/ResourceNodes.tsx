import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useInventoryStore, type ResourceType } from '../../stores/inventoryStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useQuestStore } from '../../stores/questStore'
import { useGameLogStore } from '../../stores/gameStore'
import { getTerrainHeightAt } from './Terrain'
import { RESOURCES, rollQuality, type ResourceNode } from '../../data/resources'
import { fbm2D } from '../../utils/noise'
import { seededRandom } from '../../utils/math'

const RESOURCE_COUNT = 300
const GATHER_RANGE = 2.5
const RESPAWN_TIME = 30

function generateResources(): ResourceNode[] {
  const nodes: ResourceNode[] = []
  const rng = seededRandom(12345)

  for (let i = 0; i < RESOURCE_COUNT; i++) {
    const x = (rng() - 0.5) * 200
    const z = (rng() - 0.5) * 200
    const y = getTerrainHeightAt(x, z)

    if (y < -0.3) continue // skip deep water

    // Determine resource type by biome
    const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
    let type: string
    const typeRoll = rng()
    if (biomeNoise < -0.3) {
      // desert - mostly minerals
      type = typeRoll < 0.5 ? 'minerals' : typeRoll < 0.8 ? 'food' : 'wood'
    } else if (biomeNoise < -0.05) {
      // swamp - water heavy
      type = typeRoll < 0.4 ? 'water' : typeRoll < 0.7 ? 'leaves' : 'food'
    } else if (biomeNoise < 0.2) {
      // forest
      type = typeRoll < 0.3 ? 'wood' : typeRoll < 0.55 ? 'food' : typeRoll < 0.8 ? 'leaves' : 'minerals'
    } else if (biomeNoise < 0.45) {
      // garden
      type = typeRoll < 0.35 ? 'food' : typeRoll < 0.6 ? 'leaves' : typeRoll < 0.8 ? 'water' : 'wood'
    } else {
      // cave
      type = typeRoll < 0.5 ? 'minerals' : typeRoll < 0.7 ? 'water' : 'wood'
    }

    const quality = rollQuality()

    nodes.push({
      id: `res-${i}`,
      resourceType: type,
      quality: quality.name,
      x,
      y: y + 0.2,
      z,
      amount: Math.ceil(RESOURCES.find((r) => r.id === type)!.baseYield * quality.yieldMultiplier),
      maxAmount: Math.ceil(RESOURCES.find((r) => r.id === type)!.baseYield * quality.yieldMultiplier),
      respawnTimer: 0,
      glowIntensity: quality.glowIntensity,
    })
  }
  return nodes
}

const RESOURCE_COLORS: Record<string, string> = {
  food: '#e67e22',
  wood: '#8b4513',
  leaves: '#27ae60',
  minerals: '#95a5a6',
  water: '#3498db',
}

function ResourceNodeMesh({ node, onGather }: { node: ResourceNode; onGather: (id: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // Gentle bobbing
    meshRef.current.position.y = node.y + Math.sin(clock.getElapsedTime() * 2 + node.x) * 0.05
    meshRef.current.rotation.y += 0.01
  })

  if (node.amount <= 0) return null

  const color = RESOURCE_COLORS[node.resourceType] || '#ffffff'
  const size = node.resourceType === 'minerals' ? 0.2 : 0.15

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh ref={meshRef} castShadow>
        {node.resourceType === 'minerals' ? (
          <octahedronGeometry args={[size, 0]} />
        ) : node.resourceType === 'water' ? (
          <sphereGeometry args={[size, 8, 6]} />
        ) : (
          <dodecahedronGeometry args={[size, 0]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={node.glowIntensity * 0.5}
          roughness={0.4}
          metalness={node.resourceType === 'minerals' ? 0.6 : 0.1}
        />
      </mesh>
      {node.glowIntensity > 0.3 && (
        <pointLight
          ref={glowRef}
          color={color}
          intensity={node.glowIntensity * 0.5}
          distance={3}
        />
      )}
    </group>
  )
}

export default function ResourceNodes() {
  const [nodes, setNodes] = useState<ResourceNode[]>(() => generateResources())
  const interactCooldown = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    interactCooldown.current = Math.max(0, interactCooldown.current - dt)

    // Respawn depleted nodes
    let needsUpdate = false
    const updated = nodes.map((node) => {
      if (node.amount <= 0 && node.respawnTimer > 0) {
        const newTimer = node.respawnTimer - dt
        if (newTimer <= 0) {
          needsUpdate = true
          const quality = rollQuality()
          return {
            ...node,
            amount: node.maxAmount,
            respawnTimer: 0,
            quality: quality.name,
            glowIntensity: quality.glowIntensity,
          }
        }
        if (newTimer !== node.respawnTimer) {
          needsUpdate = true
          return { ...node, respawnTimer: newTimer }
        }
      }
      return node
    })
    if (needsUpdate) setNodes(updated)

    // Check for interact key (E)
    if (interactCooldown.current > 0) return

    // Use keyboard events more efficiently
    const isInteracting = interactKeyDown.current
    if (!isInteracting) return

    const px = usePlayerStore.getState().positionX
    const py = usePlayerStore.getState().positionY
    const pz = usePlayerStore.getState().positionZ

    for (const node of nodes) {
      if (node.amount <= 0) continue
      const dx = node.x - px
      const dy = node.y - py
      const dz = node.z - pz
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < GATHER_RANGE) {
        gatherNode(node.id)
        interactCooldown.current = 0.5
        break
      }
    }
  })

  const gatherNode = useCallback((id: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id || n.amount <= 0) return n
        const resource = RESOURCES.find((r) => r.id === n.resourceType)!
        const amount = n.amount
        useInventoryStore.getState().addResource(n.resourceType as ResourceType, amount)
        useQuestStore.getState().updateQuestsByType('gather', n.resourceType, amount)
        useGameLogStore.getState().addMessage(
          `Gathered ${amount} ${resource.name} (${n.quality})`,
          'loot'
        )
        return { ...n, amount: 0, respawnTimer: RESPAWN_TIME }
      })
    )
  }, [])

  // Render only nearby nodes for performance
  const playerX = usePlayerStore((s) => s.positionX)
  const playerZ = usePlayerStore((s) => s.positionZ)
  const nearbyNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.amount <= 0) return false
      const dx = n.x - playerX
      const dz = n.z - playerZ
      return dx * dx + dz * dz < 60 * 60
    })
  }, [nodes, Math.floor(playerX / 10), Math.floor(playerZ / 10)])

  return (
    <group>
      {nearbyNodes.map((node) => (
        <ResourceNodeMesh key={node.id} node={node} onGather={gatherNode} />
      ))}
    </group>
  )
}

// Track interact key globally
const interactKeyDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') interactKeyDown.current = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyE') interactKeyDown.current = false
  })
}
