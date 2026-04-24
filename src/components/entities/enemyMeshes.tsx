import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Billboard } from '@react-three/drei'
import type { EnemyInstance } from '../../stores/combatStore'
import { ENEMIES } from '../../data/enemies'

export const ENEMY_DEF_MAP = new Map(ENEMIES.map(e => [e.id, e]))

export const sharedMaterials = {
  body: new THREE.MeshLambertMaterial({ color: '#4a4a4a' }),
  eye: new THREE.MeshBasicMaterial({ color: '#ff2222' }),
  leg: new THREE.MeshLambertMaterial({ color: '#333333' }),
  wing: new THREE.MeshLambertMaterial({ color: '#88aaff', transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  hpBg: new THREE.MeshBasicMaterial({ color: '#222222', transparent: true, opacity: 0.8 }),
  hpGreen: new THREE.MeshBasicMaterial({ color: '#22c55e' }),
  hpYellow: new THREE.MeshBasicMaterial({ color: '#eab308' }),
  hpRed: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
  projectile: new THREE.MeshBasicMaterial({ color: '#ff4400' }),
  mandible: new THREE.MeshLambertMaterial({ color: '#1a0a04' }),
  antenna: new THREE.MeshLambertMaterial({ color: '#2a1a0e' }),
}

export const sharedGeo = {
  sphere6: new THREE.SphereGeometry(1, 6, 4),
  sphere4: new THREE.SphereGeometry(1, 4, 3),
  plane: new THREE.PlaneGeometry(0.25, 0.03),
  hpBar: new THREE.PlaneGeometry(1, 0.03),
  leg: new THREE.CylinderGeometry(0.008, 0.005, 1, 3),
  wing: new THREE.PlaneGeometry(1, 0.5),
  segment: new THREE.SphereGeometry(1, 5, 4),
  projectile: new THREE.SphereGeometry(0.04, 4, 3),
  mandible: new THREE.ConeGeometry(0.08, 0.6, 6),
  antenna: new THREE.CylinderGeometry(0.03, 0.05, 1, 4),
}

const enemyBodyMats = new Map<string, THREE.MeshLambertMaterial>()
for (const def of ENEMIES) {
  enemyBodyMats.set(def.id, new THREE.MeshLambertMaterial({ color: def.color }))
}
const aggroMat = new THREE.MeshLambertMaterial({ color: '#cc2222', emissive: new THREE.Color('#440000') })

export function EnemyMesh({ enemy }: { enemy: EnemyInstance }) {
  const def = ENEMY_DEF_MAP.get(enemy.type)
  if (!def) return null

  const hpPercent = enemy.hp / enemy.maxHp
  const s = def.scale * 0.12 * (enemy.isBoss ? 1.5 : 1)
  const currentMat = enemy.isAggro ? aggroMat : (enemyBodyMats.get(enemy.type) || sharedMaterials.body)
  const hpMat = hpPercent > 0.5 ? sharedMaterials.hpGreen : hpPercent > 0.25 ? sharedMaterials.hpYellow : sharedMaterials.hpRed

  const isSpiderOrBeetle = def.id === 'spider' || def.id === 'beetle' || def.id === 'boss_beetle_king' || def.id === 'boss_spider_queen'
  const isCentipede = def.id === 'centipede'
  const isFlying = def.attackPattern === 'flying'
  const isAnt = def.id === 'aphid' || def.id === 'ant_archer'

  return (
    <group>
      {isAnt ? (
        <>
          {/* Ant thorax — narrower, elongated middle segment */}
          <mesh geometry={sharedGeo.sphere6} material={currentMat}
            scale={[s * 0.38, s * 0.38, s * 0.5]} castShadow={false} />

          {/* Head — slightly larger and forward */}
          <mesh geometry={sharedGeo.sphere6} material={currentMat}
            position={[0, s * 0.12, -s * 0.6]} scale={[s * 0.32, s * 0.3, s * 0.32]} castShadow={false} />

          {/* Petiole (narrow waist joint) */}
          <mesh geometry={sharedGeo.sphere4} material={currentMat}
            position={[0, 0, s * 0.35]} scale={[s * 0.14, s * 0.14, s * 0.12]} castShadow={false} />

          {/* Gaster — teardrop abdomen */}
          <mesh geometry={sharedGeo.sphere6} material={currentMat}
            position={[0, s * 0.03, s * 0.7]} scale={[s * 0.45, s * 0.4, s * 0.6]} castShadow={false} />

          {/* Mandibles — two dark curved points projecting forward from the head */}
          <mesh geometry={sharedGeo.mandible} material={sharedMaterials.mandible}
            position={[s * 0.1, s * 0.05, -s * 0.85]}
            rotation={[Math.PI / 2 + 0.2, 0, -0.35]}
            scale={[s * 0.5, s * 0.5, s * 0.5]} />
          <mesh geometry={sharedGeo.mandible} material={sharedMaterials.mandible}
            position={[-s * 0.1, s * 0.05, -s * 0.85]}
            rotation={[Math.PI / 2 + 0.2, 0, 0.35]}
            scale={[s * 0.5, s * 0.5, s * 0.5]} />

          {/* Antennae — forward-angled from the top of the head */}
          <mesh geometry={sharedGeo.antenna} material={sharedMaterials.antenna}
            position={[s * 0.08, s * 0.35, -s * 0.78]}
            rotation={[-0.9, 0, -0.35]}
            scale={[1, s * 0.55, 1]} />
          <mesh geometry={sharedGeo.antenna} material={sharedMaterials.antenna}
            position={[-s * 0.08, s * 0.35, -s * 0.78]}
            rotation={[-0.9, 0, 0.35]}
            scale={[1, s * 0.55, 1]} />

          {/* Eyes */}
          <mesh geometry={sharedGeo.sphere4} material={sharedMaterials.eye}
            position={[s * 0.14, s * 0.18, -s * 0.72]} scale={[s * 0.06, s * 0.06, s * 0.06]} />
          <mesh geometry={sharedGeo.sphere4} material={sharedMaterials.eye}
            position={[-s * 0.14, s * 0.18, -s * 0.72]} scale={[s * 0.06, s * 0.06, s * 0.06]} />
        </>
      ) : (
        <>
          <mesh geometry={sharedGeo.sphere6} material={currentMat} scale={[s * 0.6, s * 0.45, s * 0.7]} castShadow={false} />

          <mesh geometry={sharedGeo.sphere6} material={currentMat}
            position={[0, s * 0.1, -s * 0.55]} scale={[s * 0.35, s * 0.3, s * 0.35]} castShadow={false} />

          <mesh geometry={sharedGeo.sphere4} material={sharedMaterials.eye}
            position={[s * 0.12, s * 0.18, -s * 0.78]} scale={[s * 0.08, s * 0.08, s * 0.08]} />
          <mesh geometry={sharedGeo.sphere4} material={sharedMaterials.eye}
            position={[-s * 0.12, s * 0.18, -s * 0.78]} scale={[s * 0.08, s * 0.08, s * 0.08]} />

          {isFlying && (
            <mesh geometry={sharedGeo.sphere6} material={currentMat}
              position={[0, s * 0.05, s * 0.6]} scale={[s * 0.5, s * 0.4, s * 0.55]} castShadow={false} />
          )}
        </>
      )}

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

export interface DyingEnemy {
  id: number
  x: number; y: number; z: number
  type: string; timer: number
}

export let _dyingId = 0
export function nextDyingId() { return ++_dyingId }
export function resetDyingId() { _dyingId = 0 }

export const dyingEnemiesRef: { current: DyingEnemy[] } = { current: [] }

export function DeadEnemyMesh({ dying }: { dying: DyingEnemy }) {
  const def = ENEMY_DEF_MAP.get(dying.type)
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshLambertMaterial>(null)

  useFrame((_, delta) => {
    if (!groupRef.current || !matRef.current) return
    dying.timer += delta
    const progress = dying.timer / 0.6
    const scale = Math.max(0, 1 - progress)
    groupRef.current.scale.setScalar(scale)
    groupRef.current.position.y = dying.y + progress * 0.3
    matRef.current.opacity = Math.max(0, 1 - progress)
  })

  if (!def) return null
  const s = def.scale * 0.12

  return (
    <group ref={groupRef} position={[dying.x, dying.y, dying.z]}>
      <mesh geometry={sharedGeo.sphere6} scale={[s * 0.6, s * 0.6, s * 0.6]}>
        <meshLambertMaterial ref={matRef} color="#ff4444" transparent opacity={1} />
      </mesh>
    </group>
  )
}
