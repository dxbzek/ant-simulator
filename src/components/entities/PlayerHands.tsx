import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerStore } from '../../stores/playerStore'
import { useCombatStore } from '../../stores/combatStore'

export default function PlayerHands() {
  const groupRef = useRef<THREE.Group>(null)
  const leftRef = useRef<THREE.Mesh>(null)
  const rightRef = useRef<THREE.Mesh>(null)

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.copy(camera.position)
    groupRef.current.quaternion.copy(camera.quaternion)

    const t = clock.getElapsedTime()
    const isSprinting = usePlayerStore.getState().isSprinting
    const isAttacking = mouseDown.current
    const bobSpeed = isSprinting ? 8 : 4
    const bob = Math.sin(t * bobSpeed) * 0.002

    if (leftRef.current && rightRef.current) {
      leftRef.current.position.y = -0.055 + bob
      rightRef.current.position.y = -0.055 + bob

      if (isAttacking) {
        const snap = Math.sin(t * 14) * 0.5 + 0.5
        leftRef.current.rotation.z = -0.3 + snap * 0.25
        rightRef.current.rotation.z = 0.3 - snap * 0.25
      } else {
        leftRef.current.rotation.z = -0.15 + Math.sin(t * 1.5) * 0.02
        rightRef.current.rotation.z = 0.15 - Math.sin(t * 1.5) * 0.02
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Left mandible */}
      <mesh ref={leftRef} position={[-0.035, -0.055, -0.11]} rotation={[0.4, 0, -0.15]}>
        <coneGeometry args={[0.006, 0.06, 3]} />
        <meshLambertMaterial color="#2d1a0a" />
      </mesh>
      {/* Right mandible */}
      <mesh ref={rightRef} position={[0.035, -0.055, -0.11]} rotation={[0.4, 0, 0.15]}>
        <coneGeometry args={[0.006, 0.06, 3]} />
        <meshLambertMaterial color="#2d1a0a" />
      </mesh>
      {/* Left antenna */}
      <mesh position={[-0.02, 0.025, -0.09]} rotation={[0.5, 0, -0.4]}>
        <cylinderGeometry args={[0.002, 0.003, 0.08, 3]} />
        <meshLambertMaterial color="#3a2010" />
      </mesh>
      {/* Right antenna */}
      <mesh position={[0.02, 0.025, -0.09]} rotation={[0.5, 0, 0.4]}>
        <cylinderGeometry args={[0.002, 0.003, 0.08, 3]} />
        <meshLambertMaterial color="#3a2010" />
      </mesh>
    </group>
  )
}

const mouseDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown.current = true })
  window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown.current = false })
}
