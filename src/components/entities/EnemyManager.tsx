import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Billboard } from '@react-three/drei'
import { useCombatStore, type EnemyInstance, type Projectile } from '../../stores/combatStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useQuestStore } from '../../stores/questStore'
import { useResearchStore } from '../../stores/researchStore'
import { RESEARCH_NODES } from '../../data/research'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { useWorldStore } from '../../stores/worldStore'
import { ENEMIES } from '../../data/enemies'
import { EQUIPMENT } from '../../data/equipment'
import { getTerrainHeightAt } from '../world/Terrain'
import { distance2D } from '../../utils/math'
import { spawnDamageNumber } from '../ui/DamageNumbers'
import { activeEventEffects, colonyBonuses } from '../../systems/gameLoop'

const MAX_ENEMIES = 10
const SPAWN_RANGE = 30
const DESPAWN_RANGE = 45
const SPAWN_INTERVAL = 5

// --- Pre-built lookup maps for O(1) access ---
const ENEMY_DEF_MAP = new Map(ENEMIES.map(e => [e.id, e]))
const RESEARCH_NODE_MAP = new Map(RESEARCH_NODES.map(n => [n.id, n]))

// --- Cached research bonuses (refreshed on research completion) ---
let _cachedVenomDamage = 0

function refreshResearchCache() {
  const completed = useResearchStore.getState().completed
  _cachedVenomDamage = 0
  for (const nodeId of completed) {
    const node = RESEARCH_NODE_MAP.get(nodeId)
    if (node?.effect?.startsWith('venomDamage:')) {
      _cachedVenomDamage += parseFloat(node.effect.split(':')[1]) || 0
    }
  }
}

// Subscribe to research changes
useResearchStore.subscribe((state, prev) => {
  if (state.completed.length !== (prev as any)?.completed?.length) {
    refreshResearchCache()
  }
})
refreshResearchCache()

// Venom poison tracking
const poisonedEnemies = new Map<string, number>()

// Burrowing teleport tracking
const burrowTimers = new Map<string, number>()

// Track boss alive state
let _bossAlive = false
export function resetBossAlive() { _bossAlive = false }

function spawnEnemy(px: number, pz: number, playerLevel: number): EnemyInstance | null {
  const currentBiome = useWorldStore.getState().currentBiome
  const timeOfDay = useWorldStore.getState().timeOfDay
  const isNight = timeOfDay === 'night'

  // Boss spawn chance: 2% per cycle if player meets level requirement and no boss alive
  if (!_bossAlive && Math.random() < 0.02) {
    const eligibleBosses = ENEMIES.filter(e => e.isBoss && e.minLevel <= playerLevel && e.biomes.includes(currentBiome))
    if (eligibleBosses.length > 0) {
      const bossDef = eligibleBosses[Math.floor(Math.random() * eligibleBosses.length)]
      const angle = Math.random() * Math.PI * 2
      const dist = 20 + Math.random() * 5
      const bx = px + Math.cos(angle) * dist
      const bz = pz + Math.sin(angle) * dist
      const by = getTerrainHeightAt(bx, bz)
      const levelScale = 1 + (playerLevel - bossDef.minLevel) * 0.05
      _bossAlive = true
      useGameLogStore.getState().addMessage(`You sense a powerful presence... ${bossDef.name} approaches!`, 'combat')
      return {
        id: `boss-${Date.now()}`,
        type: bossDef.id,
        x: bx, y: by + 0.05, z: bz,
        hp: Math.ceil(bossDef.hp * levelScale),
        maxHp: Math.ceil(bossDef.hp * levelScale),
        attack: Math.ceil(bossDef.attack * levelScale),
        defense: Math.ceil(bossDef.defense * levelScale),
        speed: bossDef.speed,
        aggroRange: bossDef.aggroRange,
        isAggro: false,
        isBoss: true,
        attackPattern: bossDef.attackPattern,
        lastAttackTime: 0,
        attackCooldown: bossDef.attackCooldown,
        lootTable: bossDef.id,
      }
    }
  }

  const angle = Math.random() * Math.PI * 2
  const dist = 15 + Math.random() * (SPAWN_RANGE - 15)
  const x = px + Math.cos(angle) * dist
  const z = pz + Math.sin(angle) * dist
  const y = getTerrainHeightAt(x, z)

  // Filter by biome first, fall back to all if none match
  let eligible = ENEMIES.filter((e) => !e.isBoss && e.minLevel <= playerLevel + 2 && e.biomes.includes(currentBiome))
  if (eligible.length === 0) {
    eligible = ENEMIES.filter((e) => !e.isBoss && e.minLevel <= playerLevel + 2)
  }
  if (eligible.length === 0) return null

  const def = eligible[Math.floor(Math.random() * eligible.length)]
  const levelScale = 1 + (playerLevel - def.minLevel) * 0.1
  // Night bonus: enemies are 20% stronger
  const nightMult = isNight ? 1.2 : 1

  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: def.id,
    x, y: y + 0.05, z,
    hp: Math.ceil(def.hp * levelScale * nightMult),
    maxHp: Math.ceil(def.hp * levelScale * nightMult),
    attack: Math.ceil(def.attack * levelScale * nightMult),
    defense: Math.ceil(def.defense * levelScale * nightMult),
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

// --- Shared materials (created once, reused across all enemies) ---
const sharedMaterials = {
  body: new THREE.MeshLambertMaterial({ color: '#4a4a4a' }),
  bodyAggro: new THREE.MeshLambertMaterial({ color: '#cc2222', emissive: new THREE.Color('#440000') }),
  eye: new THREE.MeshBasicMaterial({ color: '#ff2222' }),
  leg: new THREE.MeshLambertMaterial({ color: '#333333' }),
  wing: new THREE.MeshLambertMaterial({ color: '#88aaff', transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  hpBg: new THREE.MeshBasicMaterial({ color: '#222222', transparent: true, opacity: 0.8 }),
  hpGreen: new THREE.MeshBasicMaterial({ color: '#22c55e' }),
  hpYellow: new THREE.MeshBasicMaterial({ color: '#eab308' }),
  hpRed: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
  projectile: new THREE.MeshBasicMaterial({ color: '#ff4400' }),
  dying: new THREE.MeshLambertMaterial({ color: '#ff4444', transparent: true }),
}

// --- Shared geometries ---
const sharedGeo = {
  sphere6: new THREE.SphereGeometry(1, 6, 4),
  sphere4: new THREE.SphereGeometry(1, 4, 3),
  plane: new THREE.PlaneGeometry(0.25, 0.03),
  hpBar: new THREE.PlaneGeometry(1, 0.03),
  leg: new THREE.CylinderGeometry(0.008, 0.005, 1, 3),
  wing: new THREE.PlaneGeometry(1, 0.5),
  segment: new THREE.SphereGeometry(1, 5, 4),
  projectile: new THREE.SphereGeometry(0.04, 4, 3),
}

// Pre-build body materials for each enemy type — avoids per-instance allocation
const enemyBodyMats = new Map<string, THREE.MeshLambertMaterial>()
for (const def of ENEMIES) {
  enemyBodyMats.set(def.id, new THREE.MeshLambertMaterial({ color: def.color }))
}
const aggroMat = new THREE.MeshLambertMaterial({ color: '#cc2222', emissive: new THREE.Color('#440000') })

function EnemyMesh({ enemy }: { enemy: EnemyInstance }) {
  const def = ENEMY_DEF_MAP.get(enemy.type)
  if (!def) return null

  const hpPercent = enemy.hp / enemy.maxHp
  const s = def.scale * 0.12 * (enemy.isBoss ? 1.5 : 1)
  const currentMat = enemy.isAggro ? aggroMat : (enemyBodyMats.get(enemy.type) || sharedMaterials.body)
  const hpMat = hpPercent > 0.5 ? sharedMaterials.hpGreen : hpPercent > 0.25 ? sharedMaterials.hpYellow : sharedMaterials.hpRed

  // Build body parts based on enemy type
  const isSpiderOrBeetle = def.id === 'spider' || def.id === 'beetle' || def.id === 'boss_beetle_king' || def.id === 'boss_spider_queen'
  const isCentipede = def.id === 'centipede'
  const isFlying = def.attackPattern === 'flying'
  const isAnt = def.id === 'aphid' || def.id === 'ant_archer'

  return (
    <group>
      {/* Main body */}
      <mesh geometry={sharedGeo.sphere6} material={currentMat} scale={[s * 0.6, s * 0.45, s * 0.7]} castShadow={false} />

      {/* Head */}
      <mesh geometry={sharedGeo.sphere6} material={currentMat}
        position={[0, s * 0.1, -s * 0.55]} scale={[s * 0.35, s * 0.3, s * 0.35]} castShadow={false} />

      {/* Eyes */}
      <mesh geometry={sharedGeo.sphere4} material={sharedMaterials.eye}
        position={[s * 0.12, s * 0.18, -s * 0.78]} scale={[s * 0.08, s * 0.08, s * 0.08]} />
      <mesh geometry={sharedGeo.sphere4} material={sharedMaterials.eye}
        position={[-s * 0.12, s * 0.18, -s * 0.78]} scale={[s * 0.08, s * 0.08, s * 0.08]} />

      {/* Abdomen for ants/wasps */}
      {(isAnt || isFlying) && (
        <mesh geometry={sharedGeo.sphere6} material={currentMat}
          position={[0, s * 0.05, s * 0.6]} scale={[s * 0.5, s * 0.4, s * 0.55]} castShadow={false} />
      )}

      {/* Legs - 6 legs for spiders/beetles/ants, 4 for others */}
      {(isSpiderOrBeetle || isAnt || isCentipede) && (
        <>
          {[[-1, -0.3], [-1, 0], [-1, 0.3], [1, -0.3], [1, 0], [1, 0.3]].map(([side, zOff], i) => (
            <mesh key={i} geometry={sharedGeo.leg} material={sharedMaterials.leg}
              position={[side * s * 0.5, -s * 0.15, zOff * s]}
              rotation={[0, 0, side * 0.6]}
              scale={[1, s * 3, 1]} />
          ))}
        </>
      )}

      {/* Extra segments for centipede */}
      {isCentipede && (
        <>
          <mesh geometry={sharedGeo.segment} material={currentMat}
            position={[0, 0, s * 0.5]} scale={[s * 0.5, s * 0.35, s * 0.45]} />
          <mesh geometry={sharedGeo.segment} material={currentMat}
            position={[0, 0, s * 1.0]} scale={[s * 0.45, s * 0.3, s * 0.4]} />
          <mesh geometry={sharedGeo.segment} material={currentMat}
            position={[0, 0, s * 1.4]} scale={[s * 0.35, s * 0.25, s * 0.35]} />
        </>
      )}

      {/* Wings for flying enemies */}
      {isFlying && (
        <>
          <mesh geometry={sharedGeo.wing} material={sharedMaterials.wing}
            position={[s * 0.4, s * 0.35, 0]}
            rotation={[0, 0, 0.3]}
            scale={[s * 2.5, s * 1.2, 1]} />
          <mesh geometry={sharedGeo.wing} material={sharedMaterials.wing}
            position={[-s * 0.4, s * 0.35, 0]}
            rotation={[0, 0, -0.3]}
            scale={[s * 2.5, s * 1.2, 1]} />
        </>
      )}

      {/* HP bar + name when aggro */}
      {enemy.isAggro && (
        <Billboard position={[0, s * 1.5 + 0.12, 0]}>
          <Text
            position={[0, 0.04, 0]}
            fontSize={0.04}
            color={enemy.isBoss ? '#ff4444' : '#ffffff'}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.003}
            outlineColor="#000000"
          >
            {def.name}{enemy.isBoss ? ' [BOSS]' : ''}
          </Text>
          <mesh geometry={sharedGeo.plane} material={sharedMaterials.hpBg} scale={[1, 1, 1]} />
          <mesh geometry={sharedGeo.hpBar} material={hpMat}
            position={[(hpPercent - 1) * 0.125, 0, 0.001]}
            scale={[hpPercent * 0.25, 1, 1]} />
        </Billboard>
      )}
    </group>
  )
}

interface DyingEnemy {
  x: number; y: number; z: number
  type: string; timer: number
}

function DeadEnemyMesh({ dying }: { dying: DyingEnemy }) {
  const def = ENEMY_DEF_MAP.get(dying.type)
  if (!def) return null

  const progress = dying.timer / 0.6
  const scale = Math.max(0, 1 - progress)
  const s = def.scale * 0.12

  return (
    <group position={[dying.x, dying.y + progress * 0.3, dying.z]} scale={[scale, scale, scale]}>
      <mesh geometry={sharedGeo.sphere6} scale={[s * 0.6, s * 0.6, s * 0.6]}>
        <meshLambertMaterial color="#ff4444" transparent opacity={Math.max(0, 1 - progress)} />
      </mesh>
    </group>
  )
}

const dyingEnemiesRef: { current: DyingEnemy[] } = { current: [] }

// Refs for all enemy group positions — updated from parent useFrame
const enemyGroupRefs = new Map<string, THREE.Group>()

export default function EnemyManager() {
  const spawnTimer = useRef(0)
  const attackTimer = useRef(0)
  // Only re-render when enemy count changes, not position updates
  const enemyCount = useCombatStore((s) => s.enemies.length)
  const [renderVersion, setRenderVersion] = useState(0)
  const enemiesSnapshotRef = useRef<EnemyInstance[]>([])
  const [dyingEnemies, setDyingEnemies] = useState<DyingEnemy[]>([])

  // Update snapshot only when count changes
  useMemo(() => {
    enemiesSnapshotRef.current = useCombatStore.getState().enemies
  }, [enemyCount, renderVersion])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    if (useGameStore.getState().screen !== 'playing') return

    // --- Single batched getState() calls ---
    const player = usePlayerStore.getState()
    const combat = useCombatStore.getState()
    const px = player.positionX
    const py = player.positionY
    const pz = player.positionZ
    const playerLevel = player.level
    if (player.isDead) return

    const elapsedTime = clock.getElapsedTime()

    // --- Update all enemy group positions from here (no per-enemy useFrame) ---
    for (const enemy of combat.enemies) {
      const group = enemyGroupRefs.get(enemy.id)
      if (!group) continue
      group.position.set(enemy.x, enemy.y, enemy.z)
      group.position.y += Math.sin(elapsedTime * 3 + enemy.x) * 0.015
      // Flying enemies bob higher
      if (enemy.attackPattern === 'flying') {
        group.position.y += 0.3 + Math.sin(elapsedTime * 2 + enemy.z) * 0.1
      }
      if (enemy.isAggro) {
        group.rotation.y = Math.atan2(px - enemy.x, pz - enemy.z)
      }
    }

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

    // Despawn far enemies (don't despawn bosses easily)
    for (const e of combat.enemies) {
      const despawnDist = e.isBoss ? DESPAWN_RANGE * 2 : DESPAWN_RANGE
      if (distance2D(e.x, e.z, px, pz) > despawnDist) {
        if (e.isBoss) _bossAlive = false
        combat.removeEnemy(e.id)
      }
    }

    // Spawn (faster at night)
    spawnTimer.current += dt
    const nightSpawnMult = useWorldStore.getState().timeOfDay === 'night' ? 1.5 : 1
    const adjustedSpawnInterval = SPAWN_INTERVAL / (activeEventEffects.spawnRateMultiplier * nightSpawnMult)
    if (spawnTimer.current >= adjustedSpawnInterval && combat.enemies.length < MAX_ENEMIES) {
      spawnTimer.current = 0
      const newEnemy = spawnEnemy(px, pz, playerLevel)
      if (newEnemy) combat.addEnemy(newEnemy)
    }

    // Update enemies — skip distant non-aggro
    let inCombat = false
    const AGGRO_CHECK_SKIP = 25 + colonyBonuses.detectionRange
    for (const enemy of combat.enemies) {
      const dist = distance2D(enemy.x, enemy.z, px, pz)
      if (!enemy.isAggro && dist > AGGRO_CHECK_SKIP) continue

      // Fog reduces enemy detection range by 40%
      const weatherMod = useWorldStore.getState().weather === 'fog' ? 0.6 : 1
      const isAggro = dist < enemy.aggroRange * weatherMod
      if (isAggro !== enemy.isAggro) {
        combat.updateEnemy(enemy.id, { isAggro })
      }

      if (isAggro) {
        inCombat = true
        const angle = Math.atan2(px - enemy.x, pz - enemy.z)
        const moveSpeed = enemy.speed * dt
        let newX = enemy.x, newZ = enemy.z
        const flyBonus = enemy.attackPattern === 'flying' ? 0.4 : 0

        if (enemy.attackPattern === 'ranged') {
          if (dist > 8) {
            newX += Math.sin(angle) * moveSpeed
            newZ += Math.cos(angle) * moveSpeed
          } else if (dist < 5) {
            newX -= Math.sin(angle) * moveSpeed * 0.5
            newZ -= Math.cos(angle) * moveSpeed * 0.5
          }
        } else if (enemy.attackPattern === 'burrowing') {
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
          if (dist > 1.2) {
            newX += Math.sin(angle) * moveSpeed
            newZ += Math.cos(angle) * moveSpeed
          }
        }

        const newY = getTerrainHeightAt(newX, newZ) + 0.05
        combat.updateEnemy(enemy.id, { x: newX, y: newY + flyBonus, z: newZ })

        // Attack logic
        const now = performance.now() / 1000
        if (now - enemy.lastAttackTime >= enemy.attackCooldown) {
          if (enemy.attackPattern === 'ranged' && dist < 12 && dist > 2) {
            const dx = px - enemy.x, dz = pz - enemy.z
            const projDist = Math.sqrt(dx * dx + dz * dz) || 1
            const projSpeed = 10
            combat.addProjectile({
              id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              x: enemy.x, y: enemy.y + 0.15, z: enemy.z,
              vx: (dx / projDist) * projSpeed, vy: 0, vz: (dz / projDist) * projSpeed,
              damage: enemy.attack, fromEnemy: true, lifetime: 3,
            })
            combat.updateEnemy(enemy.id, { lastAttackTime: now })
          } else if (dist < 1.5 && enemy.attackPattern !== 'ranged') {
            player.takeDamage(enemy.attack)
            combat.updateEnemy(enemy.id, { lastAttackTime: now })
            const def = ENEMY_DEF_MAP.get(enemy.type)
            const name = def?.name || 'Enemy'
            useGameLogStore.getState().addMessage(`${name} hits you for ${enemy.attack}!`, 'combat')
            spawnDamageNumber(px, py + 0.3, pz, enemy.attack, 'received')
          }
        }
      }
    }
    combat.setInCombat(inCombat)

    // Tick poison on enemies
    for (const [enemyId, remaining] of poisonedEnemies.entries()) {
      const newRemaining = remaining - dt
      if (newRemaining <= 0) {
        poisonedEnemies.delete(enemyId)
      } else {
        poisonedEnemies.set(enemyId, newRemaining)
        if (_cachedVenomDamage > 0) {
          const result = combat.damageEnemy(enemyId, _cachedVenomDamage * dt)
          if (result && result.hp <= 0) {
            const def = ENEMY_DEF_MAP.get(result.type)
            if (def) {
              if (def.isBoss) _bossAlive = false
              dyingEnemiesRef.current.push({ x: result.x, y: result.y, z: result.z, type: result.type, timer: 0 })
              setDyingEnemies([...dyingEnemiesRef.current])
              player.addXp(Math.ceil(def.xpReward * activeEventEffects.xpMultiplier))
              useGameLogStore.getState().addMessage(`${def.name} died from venom! +${def.xpReward} XP`, 'combat')
            }
            poisonedEnemies.delete(enemyId)
          }
        }
      }
    }

    // Tick projectiles
    const updatedProjectiles: typeof combat.projectiles = []
    for (const proj of combat.projectiles) {
      const nx = proj.x + proj.vx * dt
      const ny = proj.y + proj.vy * dt
      const nz = proj.z + proj.vz * dt
      const nl = proj.lifetime - dt

      if (nl <= 0) {
        combat.removeProjectile(proj.id)
        continue
      }

      if (proj.fromEnemy) {
        const dx = nx - px, dy = ny - py, dz = nz - pz
        if (dx * dx + dy * dy + dz * dz < 0.5) {
          player.takeDamage(proj.damage)
          spawnDamageNumber(px, py + 0.3, pz, proj.damage, 'received')
          useGameLogStore.getState().addMessage(`Hit by projectile for ${proj.damage}!`, 'combat')
          combat.removeProjectile(proj.id)
          continue
        }
      }

      updatedProjectiles.push({ ...proj, x: nx, y: ny, z: nz, lifetime: nl })
    }
    if (updatedProjectiles.length > 0 || combat.projectiles.length > 0) {
      combat.setProjectiles(updatedProjectiles)
    }

    // Player attack
    if (mouseDown.current && !player.isDead) {
      attackTimer.current += dt
      if (attackTimer.current >= 0.4) {
        attackTimer.current = 0
        const playerAttack = player.getEffectiveAttack()
        const rotY = player.rotationY
        const lookX = -Math.sin(rotY)
        const lookZ = -Math.cos(rotY)

        let closestEnemy: EnemyInstance | null = null
        let closestDist = 2.5

        for (const enemy of combat.enemies) {
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
          if (closestEnemy.attackPattern === 'flying' && Math.random() < 0.3) {
            useGameLogStore.getState().addMessage('Miss! Enemy dodged!', 'combat')
          } else {
            const result = combat.damageEnemy(closestEnemy.id, playerAttack)
            if (result) {
              const def = ENEMY_DEF_MAP.get(closestEnemy.type)
              const dmg = Math.max(1, playerAttack - closestEnemy.defense * 0.2)
              useGameLogStore.getState().addMessage(`Hit ${def?.name} for ${Math.ceil(dmg)}!`, 'combat')
              spawnDamageNumber(closestEnemy.x, closestEnemy.y + 0.3, closestEnemy.z, dmg, 'dealt')

              if (_cachedVenomDamage > 0 && !poisonedEnemies.has(closestEnemy.id)) {
                poisonedEnemies.set(closestEnemy.id, 3)
              }

              if (result.hp <= 0 && def) {
                poisonedEnemies.delete(closestEnemy.id)
                dyingEnemiesRef.current.push({ x: closestEnemy.x, y: closestEnemy.y, z: closestEnemy.z, type: closestEnemy.type, timer: 0 })
                setDyingEnemies([...dyingEnemiesRef.current])
                if (def.isBoss) _bossAlive = false

                player.addXp(Math.ceil(def.xpReward * activeEventEffects.xpMultiplier))
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
          }
        }
      }
    }
  })

  // Projectile rendering via refs - no React re-renders
  const projectileGroupRef = useRef<THREE.Group>(null)
  const projectileMeshPool = useRef<THREE.Mesh[]>([])
  const PROJ_POOL_SIZE = 20

  // Initialize projectile pool
  useMemo(() => {
    projectileMeshPool.current = []
    for (let i = 0; i < PROJ_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(sharedGeo.projectile, sharedMaterials.projectile)
      mesh.visible = false
      projectileMeshPool.current.push(mesh)
    }
  }, [])

  // Update projectile meshes in useFrame (already inside the main useFrame above — add to end)
  // Actually we do it via a separate useFrame for projectile visuals
  useFrame(() => {
    if (!projectileGroupRef.current) return
    const projs = useCombatStore.getState().projectiles
    const pool = projectileMeshPool.current

    // Ensure pool meshes are added to scene
    if (projectileGroupRef.current.children.length === 0) {
      for (const mesh of pool) {
        projectileGroupRef.current.add(mesh)
      }
    }

    for (let i = 0; i < pool.length; i++) {
      if (i < projs.length) {
        pool[i].position.set(projs[i].x, projs[i].y, projs[i].z)
        pool[i].visible = true
      } else {
        pool[i].visible = false
      }
    }
  })

  return (
    <group>
      {enemiesSnapshotRef.current.map((enemy) => (
        <group key={enemy.id} ref={(ref) => {
          if (ref) enemyGroupRefs.set(enemy.id, ref)
          else enemyGroupRefs.delete(enemy.id)
        }}>
          <EnemyMesh enemy={enemy} />
        </group>
      ))}
      {dyingEnemies.map((d, i) => (
        <DeadEnemyMesh key={`dead-${i}-${d.x}`} dying={d} />
      ))}
      <group ref={projectileGroupRef} />
    </group>
  )
}

const mouseDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown.current = true })
  window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown.current = false })
}
