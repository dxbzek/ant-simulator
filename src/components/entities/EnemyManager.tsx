import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombatStore, type EnemyInstance, type Projectile } from '../../stores/combatStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useQuestStore } from '../../stores/questStore'
import { useResearchStore } from '../../stores/researchStore'
import { RESEARCH_NODES } from '../../data/research'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { useWorldStore } from '../../stores/worldStore'
import { ENEMIES, type EnemyDef } from '../../data/enemies'
import { EQUIPMENT } from '../../data/equipment'
import { getTerrainHeightAt } from '../world/Terrain'
import { distance2D } from '../../utils/math'
import { spawnDamageNumber } from '../ui/DamageNumbers'
import { activeEventEffects, colonyBonuses } from '../../systems/gameLoop'
import {
  ENEMY_DEF_MAP,
  sharedMaterials,
  sharedGeo,
  EnemyMesh,
  DeadEnemyMesh,
  dyingEnemiesRef,
  nextDyingId,
  resetDyingId,
  type DyingEnemy,
} from './enemyMeshes'

const MAX_ENEMIES = 10
const SPAWN_RANGE = 30
const DESPAWN_RANGE = 45
const SPAWN_INTERVAL = 5

// --- Pre-built lookup maps for O(1) access ---
const RESEARCH_NODE_MAP = new Map(RESEARCH_NODES.map(n => [n.id, n]))
const EQUIPMENT_MAP = new Map(EQUIPMENT.map(e => [e.id, e]))

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

// Subscribe to research changes — check last element too, not just length,
// so cache stays fresh after save/load that restores the same number of nodes.
useResearchStore.subscribe((state, prev) => {
  const prevCompleted = (prev as any)?.completed as string[] | undefined
  if (state.completed.length !== prevCompleted?.length ||
      state.completed[state.completed.length - 1] !== prevCompleted?.[prevCompleted.length - 1]) {
    refreshResearchCache()
  }
})
refreshResearchCache()

// Shared loot-drop logic used by both melee and venom kills
function dropLoot(def: EnemyDef) {
  for (const loot of def.lootTable) {
    if (Math.random() < loot.chance) {
      const equip = EQUIPMENT_MAP.get(loot.itemId)
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

  // Reset module singletons on Canvas remount (new game after returning to menu)
  useEffect(() => {
    dyingEnemiesRef.current = []
    enemyGroupRefs.clear()
    poisonedEnemies.clear()
    burrowTimers.clear()
    _bossAlive = false
    resetDyingId()
  }, [])

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
    const world = useWorldStore.getState()
    const px = player.positionX
    const py = player.positionY
    const pz = player.positionZ
    const playerLevel = player.level
    const isNight = world.timeOfDay === 'night'
    const isFog = world.weather === 'fog'
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

    // Remove expired dying enemies (animation driven by DeadEnemyMesh's own useFrame)
    if (dyingEnemiesRef.current.length > 0) {
      const before = dyingEnemiesRef.current.length
      dyingEnemiesRef.current = dyingEnemiesRef.current.filter(d => d.timer < 0.6)
      if (dyingEnemiesRef.current.length !== before) {
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
    const nightSpawnMult = isNight ? 1.5 : 1
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
      const weatherMod = isFog ? 0.6 : 1
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
            newX = px + Math.cos(bAngle) * (0.5 + Math.random() * 0.8)
            newZ = pz + Math.sin(bAngle) * (0.5 + Math.random() * 0.8)
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
          if ((enemy.attackPattern === 'ranged' || enemy.attackPattern === 'flying') && dist < 12 && dist > 2) {
            // Ranged and flying enemies shoot projectiles
            const dx = px - enemy.x, dz = pz - enemy.z
            const projDist = Math.sqrt(dx * dx + dz * dz) || 1
            const projSpeed = enemy.attackPattern === 'flying' ? 12 : 10
            combat.addProjectile({
              id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              x: enemy.x, y: enemy.y + 0.15, z: enemy.z,
              vx: (dx / projDist) * projSpeed, vy: -1, vz: (dz / projDist) * projSpeed,
              damage: enemy.attack, fromEnemy: true, lifetime: 3,
            })
            combat.updateEnemy(enemy.id, { lastAttackTime: now })
          } else if (dist < 1.5 && enemy.attackPattern !== 'ranged' && enemy.attackPattern !== 'flying') {
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
          // Pass raw DoT damage; skip defense floor via direct HP reduction
          const venomDmg = _cachedVenomDamage * dt
          const enemy = combat.getEnemy(enemyId)
          if (!enemy) { poisonedEnemies.delete(enemyId); continue }
          const newHp = enemy.hp - venomDmg
          const result = newHp <= 0
            ? (() => { combat.removeEnemy(enemyId); return { ...enemy, hp: 0 } })()
            : (() => { combat.updateEnemy(enemyId, { hp: newHp }); return { ...enemy, hp: newHp } })()
          if (result && result.hp <= 0) {
            const def = ENEMY_DEF_MAP.get(result.type)
            if (def) {
              if (def.isBoss) _bossAlive = false
              dyingEnemiesRef.current.push({ id: nextDyingId(), x: result.x, y: result.y, z: result.z, type: result.type, timer: 0 })
              setDyingEnemies([...dyingEnemiesRef.current])
              player.addXp(Math.ceil(def.xpReward * activeEventEffects.xpMultiplier))
              useQuestStore.getState().updateQuestsByType('kill', def.id, 1)
              useGameLogStore.getState().addMessage(`${def.name} died from venom! +${def.xpReward} XP`, 'combat')

              dropLoot(def)
            }
            poisonedEnemies.delete(enemyId)
          }
        }
      }
    }

    // Tick projectiles — move each one, check lifetime and player collisions
    if (combat.projectiles.length > 0) {
      const aliveProjectiles: Projectile[] = []
      for (const proj of combat.projectiles) {
        const nx = proj.x + proj.vx * dt
        const ny = proj.y + proj.vy * dt
        const nz = proj.z + proj.vz * dt
        const nl = proj.lifetime - dt

        if (nl <= 0) continue

        if (proj.fromEnemy) {
          const dx = nx - px, dy = ny - py, dz = nz - pz
          if (dx * dx + dy * dy + dz * dz < 0.5) {
            player.takeDamage(proj.damage)
            spawnDamageNumber(px, py + 0.3, pz, proj.damage, 'received')
            useGameLogStore.getState().addMessage(`Hit by projectile for ${proj.damage}!`, 'combat')
            continue
          }
        }

        aliveProjectiles.push({ ...proj, x: nx, y: ny, z: nz, lifetime: nl })
      }
      combat.setProjectiles(aliveProjectiles)
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
                dyingEnemiesRef.current.push({ id: nextDyingId(), x: closestEnemy.x, y: closestEnemy.y, z: closestEnemy.z, type: closestEnemy.type, timer: 0 })
                setDyingEnemies([...dyingEnemiesRef.current])
                if (def.isBoss) _bossAlive = false

                player.addXp(Math.ceil(def.xpReward * activeEventEffects.xpMultiplier))
                useQuestStore.getState().updateQuestsByType('kill', def.id, 1)
                useGameLogStore.getState().addMessage(`Defeated ${def.name}! +${def.xpReward} XP`, 'combat')

                dropLoot(def)
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
        <DeadEnemyMesh key={d.id} dying={d} />
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
// Reset attack state when leaving the playing screen so clicks in menus don't
// carry over as held-down attacks when returning to gameplay
const _unsubScreenWatcher = useGameStore.subscribe((state) => {
  if (state.screen !== 'playing') mouseDown.current = false
})
// Clean up on HMR so subscribers don't accumulate across reloads in dev
if (import.meta.hot) {
  import.meta.hot.dispose(() => _unsubScreenWatcher())
}
