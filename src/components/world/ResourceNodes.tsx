import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useInventoryStore, type ResourceType } from '../../stores/inventoryStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useQuestStore } from '../../stores/questStore'
import { useGameLogStore } from '../../stores/gameStore'
import { getTerrainHeightAt } from './Terrain'
import { RESOURCES, rollQuality, type ResourceNode } from '../../data/resources'
import { fbm2D } from '../../utils/noise'
import { seededRandom } from '../../utils/math'

const RESOURCE_COUNT = 400
const GATHER_RANGE = 3
const RESPAWN_TIME = 30

function generateResources(): ResourceNode[] {
  const nodes: ResourceNode[] = []
  const rng = seededRandom(12345)

  for (let i = 0; i < RESOURCE_COUNT; i++) {
    const x = (rng() - 0.5) * 200
    const z = (rng() - 0.5) * 200
    const y = getTerrainHeightAt(x, z)

    if (y < -0.3) continue

    const biomeNoise = fbm2D(x * 0.005, z * 0.005, 3, 2, 0.5)
    let type: string
    const typeRoll = rng()
    if (biomeNoise < -0.3) {
      type = typeRoll < 0.5 ? 'minerals' : typeRoll < 0.8 ? 'food' : 'wood'
    } else if (biomeNoise < -0.05) {
      type = typeRoll < 0.4 ? 'water' : typeRoll < 0.7 ? 'leaves' : 'food'
    } else if (biomeNoise < 0.2) {
      type = typeRoll < 0.3 ? 'wood' : typeRoll < 0.55 ? 'food' : typeRoll < 0.8 ? 'leaves' : 'minerals'
    } else if (biomeNoise < 0.45) {
      type = typeRoll < 0.35 ? 'food' : typeRoll < 0.6 ? 'leaves' : typeRoll < 0.8 ? 'water' : 'wood'
    } else {
      type = typeRoll < 0.5 ? 'minerals' : typeRoll < 0.7 ? 'water' : 'wood'
    }

    const quality = rollQuality()

    nodes.push({
      id: `res-${i}`,
      resourceType: type,
      quality: quality.name,
      x,
      y: y + 0.08, // sit just above terrain
      z,
      amount: Math.ceil(RESOURCES.find((r) => r.id === type)!.baseYield * quality.yieldMultiplier),
      maxAmount: Math.ceil(RESOURCES.find((r) => r.id === type)!.baseYield * quality.yieldMultiplier),
      respawnTimer: 0,
      glowIntensity: quality.glowIntensity,
    })
  }
  return nodes
}

const RESOURCE_MESH_COLORS: Record<string, string> = {
  food: '#e67e22',
  wood: '#8b4513',
  leaves: '#27ae60',
  minerals: '#95a5a6',
  water: '#3498db',
}

function ResourceNodeMesh({ node }: { node: ResourceNode }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // Gentle bobbing
    meshRef.current.position.y = node.y + Math.sin(clock.getElapsedTime() * 2 + node.x) * 0.02
    meshRef.current.rotation.y += 0.008
  })

  if (node.amount <= 0) return null

  const color = RESOURCE_MESH_COLORS[node.resourceType] || '#ffffff'

  // Different visual per resource type - small, grounded, ant-scale objects
  return (
    <group ref={meshRef} position={[node.x, node.y, node.z]}>
      {node.resourceType === 'food' && (
        // Food: small berry/seed cluster
        <group>
          <mesh castShadow>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color="#d35400" roughness={0.6} emissive="#e67e22" emissiveIntensity={node.glowIntensity * 0.3} />
          </mesh>
          <mesh position={[0.06, -0.02, 0.04]} castShadow>
            <sphereGeometry args={[0.05, 6, 4]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.6} />
          </mesh>
          <mesh position={[-0.04, -0.01, -0.05]} castShadow>
            <sphereGeometry args={[0.06, 6, 4]} />
            <meshStandardMaterial color="#f39c12" roughness={0.6} />
          </mesh>
        </group>
      )}
      {node.resourceType === 'wood' && (
        // Wood: small twig/stick
        <group rotation={[0, 0, 0.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.025, 0.25, 6]} />
            <meshStandardMaterial color="#6d4c2a" roughness={0.9} emissive="#8b4513" emissiveIntensity={node.glowIntensity * 0.2} />
          </mesh>
          <mesh position={[0.05, 0.08, 0]} rotation={[0, 0, 0.8]} castShadow>
            <cylinderGeometry args={[0.01, 0.015, 0.1, 4]} />
            <meshStandardMaterial color="#7d5c3a" roughness={0.9} />
          </mesh>
        </group>
      )}
      {node.resourceType === 'leaves' && (
        // Leaves: small leaf shapes
        <group>
          <mesh castShadow rotation={[0.3, 0, 0.1]}>
            <planeGeometry args={[0.15, 0.1]} />
            <meshStandardMaterial color="#27ae60" roughness={0.5} side={THREE.DoubleSide} emissive="#2ecc71" emissiveIntensity={node.glowIntensity * 0.3} />
          </mesh>
          <mesh castShadow position={[0.04, 0.02, 0.03]} rotation={[-0.2, 0.5, 0.2]}>
            <planeGeometry args={[0.12, 0.08]} />
            <meshStandardMaterial color="#2ecc71" roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {node.resourceType === 'minerals' && (
        // Minerals: small crystal cluster
        <group>
          <mesh castShadow>
            <coneGeometry args={[0.04, 0.12, 4]} />
            <meshStandardMaterial color="#bdc3c7" roughness={0.2} metalness={0.7} emissive="#ecf0f1" emissiveIntensity={node.glowIntensity * 0.5} />
          </mesh>
          <mesh position={[0.04, -0.02, 0.02]} rotation={[0, 0.5, 0.3]} castShadow>
            <coneGeometry args={[0.03, 0.08, 4]} />
            <meshStandardMaterial color="#95a5a6" roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[-0.03, -0.02, -0.03]} rotation={[0.2, -0.3, -0.2]} castShadow>
            <coneGeometry args={[0.025, 0.07, 4]} />
            <meshStandardMaterial color="#7f8c8d" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      )}
      {node.resourceType === 'water' && (
        // Water: small water droplet
        <group>
          <mesh castShadow>
            <sphereGeometry args={[0.07, 12, 8]} />
            <meshStandardMaterial color="#3498db" roughness={0.05} metalness={0.1} transparent opacity={0.8} emissive="#2980b9" emissiveIntensity={node.glowIntensity * 0.4} />
          </mesh>
        </group>
      )}
      {/* Glow point light for rare+ items */}
      {node.glowIntensity > 0.3 && (
        <pointLight
          color={color}
          intensity={node.glowIntensity * 0.4}
          distance={2}
        />
      )}
      {/* Small indicator ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[0.12, 0.15, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
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
    if (!interactKeyDown.current) return

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
          `+${amount} ${resource.name} (${n.quality})`,
          'loot'
        )
        return { ...n, amount: 0, respawnTimer: RESPAWN_TIME }
      })
    )
  }, [])

  // Render only nearby nodes
  const playerX = usePlayerStore((s) => s.positionX)
  const playerZ = usePlayerStore((s) => s.positionZ)
  const nearbyNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.amount <= 0) return false
      const dx = n.x - playerX
      const dz = n.z - playerZ
      return dx * dx + dz * dz < 50 * 50
    })
  }, [nodes, Math.floor(playerX / 8), Math.floor(playerZ / 8)])

  return (
    <group>
      {nearbyNodes.map((node) => (
        <ResourceNodeMesh key={node.id} node={node} />
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
