import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombatStore, type EnemyInstance, type Projectile } from '../../stores/combatStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useQuestStore } from '../../stores/questStore'
import { useResearchStore } from '../../stores/researchStore'
import { RESEARCH_NODES } from '../../data/research'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { ENEMIES } from '../../data/enemies'
import { EQUIPMENT } from '../../data/equipment'
import { getTerrainHeightAt } from '../world/Terrain'
import { distance2D } from '../../utils/math'
import { spawnDamageNumber } from '../ui/DamageNumbers'

const MAX_ENEMIES = 20
const SPAWN_RANGE = 40
const DESPAWN_RANGE = 60
const SPAWN_INTERVAL = 4

// Venom poison tracking
const poisonedEnemies = new Map<string, number>() // id -> remaining time

function getVenomDamage(): number {
  const completed = useResearchStore.getState().completed
  for (const nodeId of completed) {
    const node = RESEARCH_NODES.find(n => n.id === nodeId)
    if (node?.effect?.startsWith('venomDamage:')) return parseFloat(node.effect.split(':')[1]) || 0
  }
  return 0
}

// Burrowing teleport tracking
const burrowTimers = new Map<string, number>()

function spawnEnemy(px: number, pz: number, playerLevel: number): EnemyInstance | null {
  const angle = Math.random() * Math.PI * 2
  const dist = 15 + Math.random() * (SPAWN_RANGE - 15)
  const x = px + Math.cos(angle) * dist
  const z = pz + Math.sin(angle) * dist
  const y = getTerrainHeightAt(x, z)

  const eligible = ENEMIES.filter((e) => !e.isBoss && e.minLevel <= playerLevel + 2)
  if (eligible.length === 0) return null

  const def = eligible[Math.floor(Math.random() * eligible.length)]
  const levelScale = 1 + (playerLevel - def.minLevel) * 0.1

  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

// Simple enemy mesh - just 2 spheres (body + head) for performance
function EnemyMesh({ enemy }: { enemy: EnemyInstance }) {
  const groupRef = useRef<THREE.Group>(null)
  const def = ENEMIES.find((e) => e.id === enemy.type)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.set(enemy.x, enemy.y, enemy.z)
    groupRef.current.position.y += Math.sin(clock.getElapsedTime() * 3 + enemy.x) * 0.015
    if (enemy.isAggro) {
      const px = usePlayerStore.getState().positionX
      const pz = usePlayerStore.getState().positionZ
      groupRef.current.rotation.y = Math.atan2(px - enemy.x, pz - enemy.z)
    }
  })

  if (!def) return null

  const hpPercent = enemy.hp / enemy.maxHp
  const s = def.scale * 0.12 * (enemy.isBoss ? 1.5 : 1)
  const bodyColor = enemy.isAggro ? '#cc2222' : def.color

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh castShadow={false}>
        <sphereGeometry args={[s * 0.6, 6, 4]} />
        <meshLambertMaterial color={bodyColor} emissive={enemy.isAggro ? '#440000' : '#000000'} />
      </mesh>
      {/* Head */}
      <mesh position={[0, s * 0.15, -s * 0.5]} castShadow={false}>
        <sphereGeometry args={[s * 0.35, 6, 4]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[s * 0.12, s * 0.2, -s * 0.75]}>
        <sphereGeometry args={[s * 0.08, 4, 3]} />
        <meshBasicMaterial color="#ff2222" />
      </mesh>
      <mesh position={[-s * 0.12, s * 0.2, -s * 0.75]}>
        <sphereGeometry args={[s * 0.08, 4, 3]} />
        <meshBasicMaterial color="#ff2222" />
      </mesh>
      {/* HP bar when aggro */}
      {enemy.isAggro && (
        <group position={[0, s + 0.1, 0]}>
          <mesh>
            <planeGeometry args={[0.25, 0.03]} />
            <meshBasicMaterial color="#222" transparent opacity={0.8} />
          </mesh>
          <mesh position={[(hpPercent - 1) * 0.125, 0, 0.001]}>
            <planeGeometry args={[0.25 * hpPercent, 0.03]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'} />
          </mesh>
        </group>
      )}
    </group>
  )
}

interface DyingEnemy {
  x: number; y: number; z: number
  type: string; timer: number
}

function DeadEnemyMesh({ dying }: { dying: DyingEnemy }) {
  const groupRef = useRef<THREE.Group>(null)
  const def = ENEMIES.find(e => e.id === dying.type)
  if (!def) return null

  const progress = dying.timer / 0.6 // 0.6s death animation
  const scale = Math.max(0, 1 - progress)
  const s = def.scale * 0.12

  return (
    <group ref={groupRef} position={[dying.x, dying.y + progress * 0.3, dying.z]} scale={[scale, scale, scale]}>
      <mesh>
        <sphereGeometry args={[s * 0.6, 6, 4]} />
        <meshLambertMaterial color="#ff4444" transparent opacity={Math.max(0, 1 - progress)} />
      </mesh>
    </group>
  )
}

const dyingEnemiesRef: { current: DyingEnemy[] } = { current: [] }

export default function EnemyManager() {
  const spawnTimer = useRef(0)
  const attackTimer = useRef(0)
  const enemies = useCombatStore((s) => s.enemies)
  const [dyingEnemies, setDyingEnemies] = useState<DyingEnemy[]>([])

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

    // Tick dying enemies animation
    if (dyingEnemiesRef.current.length > 0) {
      let changed = false
      dyingEnemiesRef.current = dyingEnemiesRef.current.filter(d => {
        d.timer += dt
        if (d.timer >= 0.6) { changed = true; return false }
        return true
      })
      if (changed || dyingEnemiesRef.current.some(d => d.timer < 0.6)) {
        setDyingEnemies([...dyingEnemiesRef.current])
      }
    }

    const combatState = useCombatStore.getState()

    // Despawn far enemies
    for (const e of combatState.enemies) {
      if (distance2D(e.x, e.z, px, pz) > DESPAWN_RANGE) {
        useCombatStore.getState().removeEnemy(e.id)
      }
    }

    // Spawn
    spawnTimer.current += dt
    if (spawnTimer.current >= SPAWN_INTERVAL && combatState.enemies.length < MAX_ENEMIES) {
      spawnTimer.current = 0
      const newEnemy = spawnEnemy(px, pz, playerLevel)
      if (newEnemy) useCombatStore.getState().addEnemy(newEnemy)
    }

    // Update enemies — optimized: skip distant non-aggro enemies
    let inCombat = false
    const AGGRO_CHECK_SKIP = 25 // Only do aggro checks for enemies within this range
    for (const enemy of combatState.enemies) {
      const dist = distance2D(enemy.x, enemy.z, px, pz)

      // Far non-aggro enemies: skip entirely (no store mutations)
      if (!enemy.isAggro && dist > AGGRO_CHECK_SKIP) continue

      const isAggro = dist < enemy.aggroRange
      if (isAggro !== enemy.isAggro) {
        useCombatStore.getState().updateEnemy(enemy.id, { isAggro })
      }

      if (isAggro) {
        inCombat = true
        const angle = Math.atan2(px - enemy.x, pz - enemy.z)
        const moveSpeed = enemy.speed * dt
        let newX = enemy.x, newZ = enemy.z
        const flyBonus = enemy.attackPattern === 'flying' ? 0.4 : 0

        // Movement varies by attack pattern
        if (enemy.attackPattern === 'ranged') {
          // Ranged: maintain distance of 5-8 units
          if (dist > 8) {
            newX += Math.sin(angle) * moveSpeed
            newZ += Math.cos(angle) * moveSpeed
          } else if (dist < 5) {
            newX -= Math.sin(angle) * moveSpeed * 0.5
            newZ -= Math.cos(angle) * moveSpeed * 0.5
          }
        } else if (enemy.attackPattern === 'burrowing') {
          // Burrowing: teleport near player every 5s
          const bt = burrowTimers.get(enemy.id) || 0
          burrowTimers.set(enemy.id, bt + dt)
          if (bt + dt >= 5) {
            burrowTimers.set(enemy.id, 0)
            const bAngle = Math.random() * Math.PI * 2
            newX = px + Math.cos(bAngle) * (1.5 + Math.random() * 2)
            newZ = pz + Math.sin(bAngle) * (1.5 + Math.random() * 2)
          } else if (dist > 1.2) {
            newX += Math.sin(angle) * moveSpeed * 0.6
            newZ += Math.cos(angle) * moveSpeed * 0.6
          }
        } else {
          // Melee / Flying: approach
          if (dist > 1.2) {
            newX += Math.sin(angle) * moveSpeed
            newZ += Math.cos(angle) * moveSpeed
          }
        }

        const newY = getTerrainHeightAt(newX, newZ) + 0.05
        useCombatStore.getState().updateEnemy(enemy.id, { x: newX, y: newY + flyBonus, z: newZ })

        // Attack logic varies by pattern
        const now = performance.now() / 1000
        if (now - enemy.lastAttackTime >= enemy.attackCooldown) {
          if (enemy.attackPattern === 'ranged' && dist < 12 && dist > 2) {
            // Fire projectile toward player
            const dx = px - enemy.x, dz = pz - enemy.z
            const projDist = Math.sqrt(dx * dx + dz * dz) || 1
            const projSpeed = 10
            useCombatStore.getState().addProjectile({
              id: `p-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
              x: enemy.x, y: enemy.y + 0.15, z: enemy.z,
              vx: (dx / projDist) * projSpeed, vy: 0, vz: (dz / projDist) * projSpeed,
              damage: enemy.attack, fromEnemy: true, lifetime: 3,
            })
            useCombatStore.getState().updateEnemy(enemy.id, { lastAttackTime: now })
          } else if (dist < 1.5 && enemy.attackPattern !== 'ranged') {
            usePlayerStore.getState().takeDamage(enemy.attack)
            useCombatStore.getState().updateEnemy(enemy.id, { lastAttackTime: now })
            const name = ENEMIES.find((e) => e.id === enemy.type)?.name || 'Enemy'
            useGameLogStore.getState().addMessage(`${name} hits you for ${enemy.attack}!`, 'combat')
            spawnDamageNumber(px, py + 0.3, pz, enemy.attack, 'received')
          }
        }
      }
    }
    useCombatStore.getState().setInCombat(inCombat)

    // Tick poison on enemies
    for (const [enemyId, remaining] of poisonedEnemies.entries()) {
      const newRemaining = remaining - dt
      if (newRemaining <= 0) {
        poisonedEnemies.delete(enemyId)
      } else {
        poisonedEnemies.set(enemyId, newRemaining)
        // Tick poison damage (3 per second)
        const venomDmg = getVenomDamage()
        if (venomDmg > 0) {
          const result = useCombatStore.getState().damageEnemy(enemyId, venomDmg * dt)
          if (result && result.hp <= 0) {
            const def = ENEMIES.find(e => e.id === result.type)
            if (def) {
              dyingEnemiesRef.current.push({ x: result.x, y: result.y, z: result.z, type: result.type, timer: 0 })
              setDyingEnemies([...dyingEnemiesRef.current])
              usePlayerStore.getState().addXp(def.xpReward)
              useGameLogStore.getState().addMessage(`${def.name} died from venom! +${def.xpReward} XP`, 'combat')
            }
            poisonedEnemies.delete(enemyId)
          }
        }
      }
    }

    // Tick projectiles
    const projectiles = useCombatStore.getState().projectiles
    for (const proj of projectiles) {
      proj.x += proj.vx * dt
      proj.y += proj.vy * dt
      proj.z += proj.vz * dt
      proj.lifetime -= dt

      if (proj.lifetime <= 0) {
        useCombatStore.getState().removeProjectile(proj.id)
        continue
      }

      // Check hit on player
      if (proj.fromEnemy) {
        const dx = proj.x - px, dy = proj.y - py, dz = proj.z - pz
        if (dx * dx + dy * dy + dz * dz < 0.5) {
          usePlayerStore.getState().takeDamage(proj.damage)
          spawnDamageNumber(px, py + 0.3, pz, proj.damage, 'received')
          useGameLogStore.getState().addMessage(`Hit by projectile for ${proj.damage}!`, 'combat')
          useCombatStore.getState().removeProjectile(proj.id)
        }
      }
    }

    // Player attack
    if (mouseDown.current && !isDead) {
      attackTimer.current += dt
      if (attackTimer.current >= 0.4) {
        attackTimer.current = 0
        const playerAttack = usePlayerStore.getState().getEffectiveAttack()
        const rotY = usePlayerStore.getState().rotationY
        const lookX = -Math.sin(rotY)
        const lookZ = -Math.cos(rotY)

        let closestEnemy: EnemyInstance | null = null
        let closestDist = 2.5

        for (const enemy of combatState.enemies) {
          const dx = enemy.x - px, dz = enemy.z - pz
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist > 2.5) continue
          const dot = (dx * lookX + dz * lookZ) / (dist || 1)
          if (dot > 0.3 && dist < closestDist) {
            closestDist = dist
            closestEnemy = enemy
          }
        }

        if (closestEnemy) {
          // Flying enemies have 30% dodge chance
          if (closestEnemy.attackPattern === 'flying' && Math.random() < 0.3) {
            useGameLogStore.getState().addMessage('Miss! Enemy dodged!', 'combat')
          } else {
          const result = useCombatStore.getState().damageEnemy(closestEnemy.id, playerAttack)
          if (result) {
            const def = ENEMIES.find((e) => e.id === closestEnemy!.type)
            const dmg = Math.max(1, playerAttack - closestEnemy.defense * 0.2)
            useGameLogStore.getState().addMessage(`Hit ${def?.name} for ${Math.ceil(dmg)}!`, 'combat')
            spawnDamageNumber(closestEnemy.x, closestEnemy.y + 0.3, closestEnemy.z, dmg, 'dealt')

            // Apply venom if researched
            const venomDmg = getVenomDamage()
            if (venomDmg > 0 && !poisonedEnemies.has(closestEnemy.id)) {
              poisonedEnemies.set(closestEnemy.id, 3) // 3 seconds of poison
            }

            if (result.hp <= 0 && def) {
              // Spawn death animation
              dyingEnemiesRef.current.push({ x: closestEnemy.x, y: closestEnemy.y, z: closestEnemy.z, type: closestEnemy.type, timer: 0 })
              setDyingEnemies([...dyingEnemiesRef.current])

              usePlayerStore.getState().addXp(def.xpReward)
              useQuestStore.getState().updateQuestsByType('kill', def.id, 1)
              useGameLogStore.getState().addMessage(`Defeated ${def.name}! +${def.xpReward} XP`, 'combat')

              for (const loot of def.lootTable) {
                if (Math.random() < loot.chance) {
                  const equip = EQUIPMENT.find((e) => e.id === loot.itemId)
                  if (equip) {
                    useInventoryStore.getState().addItem({
                      id: `${equip.id}-${Date.now()}`,
                      name: equip.name, type: equip.type, rarity: equip.rarity,
                      icon: equip.icon, stats: equip.stats, description: equip.description,
                    })
                    useGameLogStore.getState().addMessage(`Loot: ${equip.name} (${equip.rarity})`, 'loot')
                  }
                }
              }
            }
          }
          } // end else (not dodged)
        }
      }
    }
  })

  // Render projectiles
  const projectiles = useCombatStore((s) => s.projectiles)

  return (
    <group>
      {enemies.map((enemy) => (
        <EnemyMesh key={enemy.id} enemy={enemy} />
      ))}
      {dyingEnemies.map((d, i) => (
        <DeadEnemyMesh key={`dead-${i}-${d.x}`} dying={d} />
      ))}
      {projectiles.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.04, 4, 3]} />
          <meshBasicMaterial color="#ff4400" />
        </mesh>
      ))}
    </group>
  )
}

const mouseDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown.current = true })
  window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown.current = false })
}
