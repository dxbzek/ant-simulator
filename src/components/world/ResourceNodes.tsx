import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
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
import { activeEventEffects, colonyBonuses } from '../../systems/gameLoop'
import { useResearchStore } from '../../stores/researchStore'
import { RESEARCH_NODES } from '../../data/research'
import { EQUIPMENT } from '../../data/equipment'
import { useSettingsStore } from '../../stores/settingsStore'

// Cache gather bonus from research
const _RESEARCH_NODE_MAP = new Map(RESEARCH_NODES.map(n => [n.id, n]))
let _cachedGatherBonus = 1
function _refreshGatherBonus() {
  let mult = 1
  for (const nodeId of useResearchStore.getState().completed) {
    const rn = _RESEARCH_NODE_MAP.get(nodeId)
    if (rn?.effect?.startsWith('gatherBonus:')) {
      mult += parseFloat(rn.effect.split(':')[1]) || 0
    }
  }
  _cachedGatherBonus = mult
}
_refreshGatherBonus()
useResearchStore.subscribe(() => _refreshGatherBonus())

// Get total gatherRate from equipped items
function getEquipmentGatherRate(): number {
  const equipment = usePlayerStore.getState().equipment
  let bonus = 0
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue
    // Equipment IDs stored as "honeydew-1712345678" — match against base ID
    const baseId = itemId.replace(/-\d+$/, '')
    const equip = EQUIPMENT.find(e => e.id === baseId)
    if (equip?.stats?.gatherRate) bonus += equip.stats.gatherRate
  }
  return bonus
}

const RESOURCE_COUNT = 280
const GATHER_RANGE = 3
const RESPAWN_TIME = 30
const GATHER_TIME = 0.8 // seconds to hold E to gather

// Exported refs for InteractionPrompt UI
export const nearestResourceRef = { current: null as ResourceNode | null }
export const gatherProgress = { current: 0 }
export const resourceNodesRef = { current: [] as ResourceNode[] }

function generateResources(): ResourceNode[] {
  const nodes: ResourceNode[] = []
  const rng = seededRandom(12345)

  for (let i = 0; i < RESOURCE_COUNT; i++) {
    const x = (rng() - 0.5) * 190
    const z = (rng() - 0.5) * 190
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
      x, y: y + 0.06, z,
      amount: Math.ceil(RESOURCES.find((r) => r.id === type)!.baseYield * quality.yieldMultiplier),
      maxAmount: Math.ceil(RESOURCES.find((r) => r.id === type)!.baseYield * quality.yieldMultiplier),
      respawnTimer: 0,
      glowIntensity: quality.glowIntensity,
    })
  }
  return nodes
}

const TYPE_COLORS: Record<string, THREE.Color> = {
  food: new THREE.Color('#e67e22'),
  wood: new THREE.Color('#8b4513'),
  leaves: new THREE.Color('#27ae60'),
  minerals: new THREE.Color('#bdc3c7'),
  water: new THREE.Color('#3498db'),
}

// Single instanced mesh per resource type for performance
function ResourceTypeInstances({ nodes, type }: { nodes: ResourceNode[]; type: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const filtered = useMemo(() => nodes.filter(n => n.resourceType === type && n.amount > 0), [nodes])

  useEffect(() => {
    if (!meshRef.current) return
    const color = TYPE_COLORS[type] || new THREE.Color('#fff')

    for (let i = 0; i < filtered.length; i++) {
      const n = filtered[i]
      dummy.position.set(n.x, n.y, n.z)
      dummy.rotation.set(0, n.x * 10 % (Math.PI * 2), 0)
      const s = 0.18 + n.glowIntensity * 0.12
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Tint by quality
      const c = color.clone()
      if (n.glowIntensity > 0.5) c.multiplyScalar(1.3)
      meshRef.current.setColorAt(i, c)
    }

    // Hide unused instances
    for (let i = filtered.length; i < RESOURCE_COUNT; i++) {
      dummy.position.set(0, -100, 0)
      dummy.scale.set(0, 0, 0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    meshRef.current.count = filtered.length
  }, [filtered, type])

  const geo = useMemo(() => {
    if (type === 'minerals') return <icosahedronGeometry args={[1, 0]} />
    if (type === 'water') return <sphereGeometry args={[1, 8, 6]} />
    if (type === 'wood') return <cylinderGeometry args={[0.2, 0.35, 2.5, 5]} />
    if (type === 'leaves') return <dodecahedronGeometry args={[1, 1]} />
    return <dodecahedronGeometry args={[0.8, 0]} /> // food - berry-like
  }, [type])

  const emissive = TYPE_COLORS[type] || new THREE.Color('#fff')

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RESOURCE_COUNT]} frustumCulled castShadow={false}>
      {geo}
      <meshLambertMaterial vertexColors emissive={emissive} emissiveIntensity={0.15} />
    </instancedMesh>
  )
}

export default function ResourceNodes() {
  const [nodes, setNodes] = useState<ResourceNode[]>(() => {
    const initial = generateResources()
    resourceNodesRef.current = initial
    return initial
  })
  const respawnAccum = useRef(0)
  const gatherAccum = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    // Respawn check every 2 seconds instead of every frame
    respawnAccum.current += dt
    if (respawnAccum.current >= 2) {
      respawnAccum.current = 0
      let needsUpdate = false
      const updated = nodes.map((node) => {
        if (node.amount <= 0 && node.respawnTimer > 0) {
          const newTimer = node.respawnTimer - 2
          if (newTimer <= 0) {
            needsUpdate = true
            const quality = rollQuality()
            return { ...node, amount: node.maxAmount, respawnTimer: 0, quality: quality.name, glowIntensity: quality.glowIntensity }
          }
          needsUpdate = true
          return { ...node, respawnTimer: newTimer }
        }
        return node
      })
      if (needsUpdate) {
        resourceNodesRef.current = updated
        setNodes(updated)
      }
    }

    // Find nearest resource for interaction prompt
    const { positionX: px, positionY: py, positionZ: pz } = usePlayerStore.getState()

    let nearest: ResourceNode | null = null
    let nearestDist = GATHER_RANGE * GATHER_RANGE
    for (const node of nodes) {
      if (node.amount <= 0) continue
      const dx = node.x - px, dy = node.y - py, dz = node.z - pz
      const distSq = dx * dx + dy * dy + dz * dz
      if (distSq < nearestDist) {
        nearestDist = distSq
        nearest = node
      }
    }
    nearestResourceRef.current = nearest

    // Hold E to gather with progress
    if (nearest && interactKeyDown.current) {
      gatherAccum.current += dt
      gatherProgress.current = Math.min(1, gatherAccum.current / GATHER_TIME)
      if (gatherAccum.current >= GATHER_TIME) {
        gatherNode(nearest.id)
        gatherAccum.current = 0
        gatherProgress.current = 0
      }
    } else {
      gatherAccum.current = 0
      gatherProgress.current = 0
    }
  })

  const gatherNode = useCallback((id: string) => {
    setNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.id !== id || n.amount <= 0) return n
        const resource = RESOURCES.find((r) => r.id === n.resourceType)!
        // Apply all gather bonuses: research + events + equipment gatherRate + colony population
        const equipGatherRate = getEquipmentGatherRate()
        const baseGather = resource.baseYield
        const finalAmount = Math.ceil(
          baseGather * _cachedGatherBonus * activeEventEffects.gatherMultiplier
          * (1 + equipGatherRate) * (1 + colonyBonuses.gatherBonus)
        )
        const gathered = Math.min(finalAmount, n.amount)
        useInventoryStore.getState().addResource(n.resourceType as ResourceType, gathered)
        useQuestStore.getState().updateQuestsByType('gather', n.resourceType, gathered)
        useGameLogStore.getState().addMessage(`+${gathered} ${resource.name} (${n.quality})`, 'loot')
        const remaining = n.amount - gathered
        return { ...n, amount: remaining, respawnTimer: remaining <= 0 ? RESPAWN_TIME : n.respawnTimer }
      })
      resourceNodesRef.current = updated
      return updated
    })
  }, [])

  return (
    <group>
      <ResourceTypeInstances nodes={nodes} type="food" />
      <ResourceTypeInstances nodes={nodes} type="wood" />
      <ResourceTypeInstances nodes={nodes} type="leaves" />
      <ResourceTypeInstances nodes={nodes} type="minerals" />
      <ResourceTypeInstances nodes={nodes} type="water" />
    </group>
  )
}

const interactKeyDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => { if (e.code === useSettingsStore.getState().keybinds.interact) interactKeyDown.current = true })
  window.addEventListener('keyup', (e) => { if (e.code === useSettingsStore.getState().keybinds.interact) interactKeyDown.current = false })
}
