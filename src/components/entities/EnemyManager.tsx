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
    x, y: y + 0.3, z,
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
  const meshRef = useRef<THREE.Mesh>(null)
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
  const scale = def.scale * (enemy.isBoss ? 1.5 : 1)

  return (
    <group>
      <mesh ref={meshRef} position={[enemy.x, enemy.y, enemy.z]} castShadow>
        {/* Body */}
        <group>
          {enemy.attackPattern === 'flying' ? (
            <capsuleGeometry args={[0.15 * scale, 0.3 * scale, 4, 8]} />
          ) : (
            <sphereGeometry args={[0.2 * scale, 8, 6]} />
          )}
          <meshStandardMaterial
            color={enemy.isAggro ? '#ff4444' : def.color}
            roughness={0.6}
            emissive={enemy.isAggro ? '#ff0000' : '#000000'}
            emissiveIntensity={enemy.isAggro ? 0.2 : 0}
          />
        </group>
      </mesh>
      {/* HP bar */}
      {enemy.isAggro && (
        <group position={[enemy.x, enemy.y + 0.4 * scale, enemy.z]}>
          <mesh>
            <planeGeometry args={[0.5, 0.06]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[(hpPercent - 1) * 0.25, 0, 0.001]}>
            <planeGeometry args={[0.5 * hpPercent, 0.06]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'} />
          </mesh>
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

        const newY = getTerrainHeightAt(newX, newZ) + 0.3
        const flyingBonus = enemy.attackPattern === 'flying' ? 1.5 : 0
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
