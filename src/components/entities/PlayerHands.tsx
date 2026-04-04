import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerStore } from '../../stores/playerStore'
import { useCombatStore } from '../../stores/combatStore'

// First-person ant mandibles and antennae visible at bottom of screen
export default function PlayerHands() {
  const groupRef = useRef<THREE.Group>(null)
  const leftMandibleRef = useRef<THREE.Mesh>(null)
  const rightMandibleRef = useRef<THREE.Mesh>(null)
  const leftAntennaRef = useRef<THREE.Group>(null)
  const rightAntennaRef = useRef<THREE.Group>(null)

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return

    // Attach to camera
    groupRef.current.position.copy(camera.position)
    groupRef.current.quaternion.copy(camera.quaternion)

    const t = clock.getElapsedTime()
    const isSprinting = usePlayerStore.getState().isSprinting
    const isAttacking = mouseDown.current
    const isInCombat = useCombatStore.getState().isInCombat

    // Mandible animation
    const bobSpeed = isSprinting ? 8 : 4
    const bobAmount = isSprinting ? 0.003 : 0.001

    if (leftMandibleRef.current && rightMandibleRef.current) {
      // Walking bob
      const walkBob = Math.sin(t * bobSpeed) * bobAmount
      leftMandibleRef.current.position.y = -0.06 + walkBob
      rightMandibleRef.current.position.y = -0.06 + walkBob

      // Attack animation - mandibles snap together
      if (isAttacking) {
        const attackAnim = Math.sin(t * 12) * 0.5 + 0.5
        leftMandibleRef.current.rotation.z = -0.3 + attackAnim * 0.25
        rightMandibleRef.current.rotation.z = 0.3 - attackAnim * 0.25
      } else if (isInCombat) {
        // Combat ready - mandibles slightly open
        leftMandibleRef.current.rotation.z = -0.25 + Math.sin(t * 3) * 0.03
        rightMandibleRef.current.rotation.z = 0.25 - Math.sin(t * 3) * 0.03
      } else {
        // Idle - gentle movement
        leftMandibleRef.current.rotation.z = -0.15 + Math.sin(t * 1.5) * 0.02
        rightMandibleRef.current.rotation.z = 0.15 - Math.sin(t * 1.5) * 0.02
      }
    }

    // Antenna sway
    if (leftAntennaRef.current && rightAntennaRef.current) {
      const sway = Math.sin(t * 2) * 0.05
      const sway2 = Math.sin(t * 2.3 + 1) * 0.05
      leftAntennaRef.current.rotation.z = -0.3 + sway
      leftAntennaRef.current.rotation.x = -0.1 + sway2
      rightAntennaRef.current.rotation.z = 0.3 - sway
      rightAntennaRef.current.rotation.x = -0.1 - sway2
    }
  })

  const antColor = '#4a2810'
  const antDarkColor = '#2d1a0a'

  return (
    <group ref={groupRef}>
      {/* Left mandible */}
      <mesh
        ref={leftMandibleRef}
        position={[-0.04, -0.06, -0.12]}
        rotation={[0.4, 0, -0.15]}
      >
        <coneGeometry args={[0.008, 0.07, 4]} />
        <meshStandardMaterial color={antDarkColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Right mandible */}
      <mesh
        ref={rightMandibleRef}
        position={[0.04, -0.06, -0.12]}
        rotation={[0.4, 0, 0.15]}
      >
        <coneGeometry args={[0.008, 0.07, 4]} />
        <meshStandardMaterial color={antDarkColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Left antenna */}
      <group ref={leftAntennaRef} position={[-0.025, 0.03, -0.08]}>
        {/* Base segment */}
        <mesh rotation={[0.5, 0, -0.3]}>
          <cylinderGeometry args={[0.003, 0.004, 0.06, 4]} />
          <meshStandardMaterial color={antColor} roughness={0.5} />
        </mesh>
        {/* Tip segment */}
        <mesh position={[-0.02, 0.04, -0.02]} rotation={[0.3, 0, -0.5]}>
          <cylinderGeometry args={[0.002, 0.003, 0.05, 4]} />
          <meshStandardMaterial color={antColor} roughness={0.5} />
        </mesh>
        {/* Antenna tip */}
        <mesh position={[-0.04, 0.06, -0.04]}>
          <sphereGeometry args={[0.004, 4, 3]} />
          <meshStandardMaterial color={antColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Right antenna */}
      <group ref={rightAntennaRef} position={[0.025, 0.03, -0.08]}>
        <mesh rotation={[0.5, 0, 0.3]}>
          <cylinderGeometry args={[0.003, 0.004, 0.06, 4]} />
          <meshStandardMaterial color={antColor} roughness={0.5} />
        </mesh>
        <mesh position={[0.02, 0.04, -0.02]} rotation={[0.3, 0, 0.5]}>
          <cylinderGeometry args={[0.002, 0.003, 0.05, 4]} />
          <meshStandardMaterial color={antColor} roughness={0.5} />
        </mesh>
        <mesh position={[0.04, 0.06, -0.04]}>
          <sphereGeometry args={[0.004, 4, 3]} />
          <meshStandardMaterial color={antColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Subtle head edge at bottom of screen */}
      <mesh position={[0, -0.09, -0.1]} rotation={[0.5, 0, 0]}>
        <sphereGeometry args={[0.05, 8, 4, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color={antColor} roughness={0.6} />
      </mesh>
    </group>
  )
}

// Shared mouse state
const mouseDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouseDown.current = true
  })
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseDown.current = false
  })
}
