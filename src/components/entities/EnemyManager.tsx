import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombatStore, type EnemyInstance } from '../../stores/combatStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useQuestStore } from '../../stores/questStore'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { ENEMIES } from '../../data/enemies'
import { EQUIPMENT } from '../../data/equipment'
import { getTerrainHeightAt } from '../world/Terrain'
import { distance2D, seededRandom } from '../../utils/math'

const MAX_ENEMIES = 30
const SPAWN_RANGE = 50
const DESPAWN_RANGE = 80
const SPAWN_INTERVAL = 3

function spawnEnemy(px: number, pz: number, playerLevel: number): EnemyInstance | null {
  const angle = Math.random() * Math.PI * 2
  const dist = 20 + Math.random() * (SPAWN_RANGE - 20)
  const x = px + Math.cos(angle) * dist
  const z = pz + Math.sin(angle) * dist
  const y = getTerrainHeightAt(x, z)

  // Pick enemy type based on level and biome
  const eligible = ENEMIES.filter((e) => !e.isBoss && e.minLevel <= playerLevel + 2)
  if (eligible.length === 0) return null

  const def = eligible[Math.floor(Math.random() * eligible.length)]
  const levelScale = 1 + (playerLevel - def.minLevel) * 0.1

  return {
    id: `enemy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: def.id,
    x, y: y + 0.05, z,
    hp: Math.ceil(def.hp * levelScale),
    maxHp: Math.ceil(def.hp * levelScale),
    attack: Math.ceil(def.attack * levelScale),
    defense: Math.ceil(def.defense * levelScale),
    speed: def.speed,
    aggroRange: def.aggroRange,
    isAggro: false,
    isBoss: false,
    attackPattern: def.attackPattern,
    lastAttackTime: 0,
    attackCooldown: def.attackCooldown,
    lootTable: def.id,
  }
}

function EnemyMesh({ enemy }: { enemy: EnemyInstance }) {
  const meshRef = useRef<THREE.Group>(null)
  const def = ENEMIES.find((e) => e.id === enemy.type)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.position.set(enemy.x, enemy.y, enemy.z)
    // Idle bobbing
    meshRef.current.position.y += Math.sin(clock.getElapsedTime() * 3 + enemy.x) * 0.03
    // Face player when aggro
    if (enemy.isAggro) {
      const px = usePlayerStore.getState().positionX
      const pz = usePlayerStore.getState().positionZ
      meshRef.current.rotation.y = Math.atan2(px - enemy.x, pz - enemy.z)
    }
  })

  if (!def) return null

  const hpPercent = enemy.hp / enemy.maxHp
  // Ant-scale: scale is relative to ant body (~0.2 units)
  const s = def.scale * 0.15 * (enemy.isBoss ? 1.8 : 1)
  const bodyColor = enemy.isAggro ? '#cc2222' : def.color
  const emissiveColor = enemy.isAggro ? '#ff0000' : '#000000'
  const emissiveI = enemy.isAggro ? 0.3 : 0

  return (
    <group>
      <group ref={meshRef} position={[enemy.x, enemy.y, enemy.z]}>
        {/* Body - abdomen */}
        <mesh castShadow position={[0, s * 0.5, s * 0.3]}>
          <sphereGeometry args={[s * 0.7, 8, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} emissive={emissiveColor} emissiveIntensity={emissiveI} />
        </mesh>
        {/* Thorax */}
        <mesh castShadow position={[0, s * 0.45, 0]}>
          <sphereGeometry args={[s * 0.45, 8, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} emissive={emissiveColor} emissiveIntensity={emissiveI} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, s * 0.5, -s * 0.4]}>
          <sphereGeometry args={[s * 0.35, 8, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} emissive={emissiveColor} emissiveIntensity={emissiveI} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-s * 0.15, s * 0.6, -s * 0.65]}>
          <sphereGeometry args={[s * 0.08, 6, 4]} />
          <meshStandardMaterial color="#aa0000" emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[s * 0.15, s * 0.6, -s * 0.65]}>
          <sphereGeometry args={[s * 0.08, 6, 4]} />
          <meshStandardMaterial color="#aa0000" emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>
        {/* Legs (simplified) */}
        {[-1, 1].map((side) => (
          [0, 0.2, 0.4].map((offset, i) => (
            <mesh key={`leg-${side}-${i}`} position={[side * s * 0.4, s * 0.2, -s * 0.1 + offset * s]} rotation={[0, 0, side * 0.6]} castShadow>
              <cylinderGeometry args={[s * 0.03, s * 0.02, s * 0.5, 3]} />
              <meshStandardMaterial color={bodyColor} roughness={0.7} />
            </mesh>
          ))
        ))}
        {/* Wings for flying enemies */}
        {enemy.attackPattern === 'flying' && (
          <>
            <mesh position={[-s * 0.3, s * 0.8, s * 0.1]} rotation={[0.2, 0, -0.4]}>
              <planeGeometry args={[s * 0.8, s * 0.3]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[s * 0.3, s * 0.8, s * 0.1]} rotation={[0.2, 0, 0.4]}>
              <planeGeometry args={[s * 0.8, s * 0.3]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
          </>
        )}
      </group>
      {/* HP bar - billboard */}
      {enemy.isAggro && (
        <group position={[enemy.x, enemy.y + s * 2 + 0.1, enemy.z]}>
          <mesh>
            <planeGeometry args={[0.3, 0.04]} />
            <meshBasicMaterial color="#222222" transparent opacity={0.8} />
          </mesh>
          <mesh position={[(hpPercent - 1) * 0.15, 0, 0.001]}>
            <planeGeometry args={[0.3 * hpPercent, 0.04]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'} />
          </mesh>
          {/* Enemy name */}
          {enemy.isBoss && (
            <mesh position={[0, 0.05, 0]}>
              <planeGeometry args={[0.04, 0.04]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
          )}
        </group>
      )}
    </group>
  )
}

export default function EnemyManager() {
  const spawnTimer = useRef(0)
  const attackTimer = useRef(0)
  const enemies = useCombatStore((s) => s.enemies)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const screen = useGameStore.getState().screen
    if (screen !== 'playing') return

    const px = usePlayerStore.getState().positionX
    const py = usePlayerStore.getState().positionY
    const pz = usePlayerStore.getState().positionZ
    const playerLevel = usePlayerStore.getState().level
    const isDead = usePlayerStore.getState().isDead
    if (isDead) return

    const combatState = useCombatStore.getState()
    let currentEnemies = [...combatState.enemies]

    // Despawn far enemies
    currentEnemies = currentEnemies.filter((e) => {
      const dist = distance2D(e.x, e.z, px, pz)
      if (dist > DESPAWN_RANGE) {
        useCombatStore.getState().removeEnemy(e.id)
        return false
      }
      return true
    })

    // Spawn new enemies
    spawnTimer.current += dt
    if (spawnTimer.current >= SPAWN_INTERVAL && currentEnemies.length < MAX_ENEMIES) {
      spawnTimer.current = 0
      const newEnemy = spawnEnemy(px, pz, playerLevel)
      if (newEnemy) {
        useCombatStore.getState().addEnemy(newEnemy)
      }
    }

    // Update enemies: aggro, movement, attacking
    let inCombat = false
    for (const enemy of combatState.enemies) {
      const dist = distance2D(enemy.x, enemy.z, px, pz)

      // Aggro check
      const wasAggro = enemy.isAggro
      const isAggro = dist < enemy.aggroRange
      if (isAggro !== wasAggro) {
        useCombatStore.getState().updateEnemy(enemy.id, { isAggro })
      }

      if (isAggro) {
        inCombat = true

        // Move toward player
        const angle = Math.atan2(px - enemy.x, pz - enemy.z)
        const moveSpeed = enemy.speed * dt
        let newX = enemy.x
        let newZ = enemy.z

        if (dist > 1.5) {
          newX += Math.sin(angle) * moveSpeed
          newZ += Math.cos(angle) * moveSpeed
        }

        const newY = getTerrainHeightAt(newX, newZ) + 0.05
        const flyingBonus = enemy.attackPattern === 'flying' ? 0.5 : 0
        useCombatStore.getState().updateEnemy(enemy.id, {
          x: newX,
          y: newY + flyingBonus,
          z: newZ,
        })

        // Attack player if in range
        if (dist < 2) {
          const now = performance.now() / 1000
          if (now - enemy.lastAttackTime >= enemy.attackCooldown) {
            usePlayerStore.getState().takeDamage(enemy.attack)
            useCombatStore.getState().updateEnemy(enemy.id, { lastAttackTime: now })
            useGameLogStore.getState().addMessage(
              `${ENEMIES.find((e) => e.id === enemy.type)?.name || 'Enemy'} hits you for ${enemy.attack} damage!`,
              'combat'
            )
          }
        }
      }
    }

    useCombatStore.getState().setInCombat(inCombat)

    // Player attack (left click)
    if (mouseDown.current && !isDead) {
      attackTimer.current += dt
      if (attackTimer.current >= 0.4) {
        attackTimer.current = 0
        // Find closest enemy in front of player
        const playerAttack = usePlayerStore.getState().getEffectiveAttack()
        const rotY = usePlayerStore.getState().rotationY
        const lookX = -Math.sin(rotY)
        const lookZ = -Math.cos(rotY)

        let closestEnemy: EnemyInstance | null = null
        let closestDist = 3 // attack range

        for (const enemy of combatState.enemies) {
          const dx = enemy.x - px
          const dz = enemy.z - pz
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist > 3) continue

          // Check if roughly in front
          const dot = (dx * lookX + dz * lookZ) / (dist || 1)
          if (dot > 0.3 && dist < closestDist) {
            closestDist = dist
            closestEnemy = enemy
          }
        }

        if (closestEnemy) {
          const result = useCombatStore.getState().damageEnemy(closestEnemy.id, playerAttack)
          if (result) {
            const def = ENEMIES.find((e) => e.id === closestEnemy!.type)
            const dmgDealt = Math.max(1, playerAttack - closestEnemy.defense * 0.2)
            useGameLogStore.getState().addMessage(
              `You hit ${def?.name || 'enemy'} for ${Math.ceil(dmgDealt)} damage!`,
              'combat'
            )

            if (result.hp <= 0 && def) {
              // Enemy killed
              usePlayerStore.getState().addXp(def.xpReward)
              useQuestStore.getState().updateQuestsByType('kill', def.id, 1)
              useGameLogStore.getState().addMessage(
                `Defeated ${def.name}! +${def.xpReward} XP`,
                'combat'
              )

              // Loot drops
              for (const loot of def.lootTable) {
                if (Math.random() < loot.chance) {
                  const equip = EQUIPMENT.find((e) => e.id === loot.itemId)
                  if (equip) {
                    useInventoryStore.getState().addItem({
                      id: `${equip.id}-${Date.now()}`,
                      name: equip.name,
                      type: equip.type,
                      rarity: equip.rarity,
                      icon: equip.icon,
                      stats: equip.stats,
                      description: equip.description,
                    })
                    useGameLogStore.getState().addMessage(
                      `Loot: ${equip.name} (${equip.rarity})`,
                      'loot'
                    )
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  return (
    <group>
      {enemies.map((enemy) => (
        <EnemyMesh key={enemy.id} enemy={enemy} />
      ))}
    </group>
  )
}

// Track mouse for attacks
const mouseDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouseDown.current = true
  })
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseDown.current = false
  })
}
