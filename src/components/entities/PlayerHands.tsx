import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerStore } from '../../stores/playerStore'

// Shared materials
const mandibleMat = new THREE.MeshLambertMaterial({ color: '#2d1a0a' })
const antennaMat = new THREE.MeshLambertMaterial({ color: '#3a2010' })
const antennaTipMat = new THREE.MeshLambertMaterial({ color: '#5a3820' })

export default function PlayerHands() {
  const groupRef = useRef<THREE.Group>(null)
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)
  const leftAntennaRef = useRef<THREE.Group>(null)
  const rightAntennaRef = useRef<THREE.Group>(null)

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

    // Antenna sway animation
    if (leftAntennaRef.current && rightAntennaRef.current) {
      const sway = Math.sin(t * 2) * 0.05
      const sway2 = Math.cos(t * 1.7) * 0.04
      leftAntennaRef.current.rotation.x = 0.5 + sway
      leftAntennaRef.current.rotation.z = -0.4 + sway2
      rightAntennaRef.current.rotation.x = 0.5 + sway
      rightAntennaRef.current.rotation.z = 0.4 - sway2
    }
  })

  return (
    <group ref={groupRef}>
      {/* Left mandible - two segments with joint */}
      <group ref={leftRef} position={[-0.035, -0.055, -0.11]} rotation={[0.4, 0, -0.15]}>
        {/* Base segment */}
        <mesh material={mandibleMat}>
          <coneGeometry args={[0.008, 0.04, 3]} />
        </mesh>
        {/* Tip segment - thinner, offset */}
        <mesh position={[0, -0.035, -0.005]} rotation={[0.3, 0, 0]} material={mandibleMat}>
          <coneGeometry args={[0.004, 0.035, 3]} />
        </mesh>
      </group>

      {/* Right mandible - two segments with joint */}
      <group ref={rightRef} position={[0.035, -0.055, -0.11]} rotation={[0.4, 0, 0.15]}>
        <mesh material={mandibleMat}>
          <coneGeometry args={[0.008, 0.04, 3]} />
        </mesh>
        <mesh position={[0, -0.035, -0.005]} rotation={[0.3, 0, 0]} material={mandibleMat}>
          <coneGeometry args={[0.004, 0.035, 3]} />
        </mesh>
      </group>

      {/* Left antenna - longer, curved with tip bulb */}
      <group ref={leftAntennaRef} position={[-0.02, 0.025, -0.09]} rotation={[0.5, 0, -0.4]}>
        {/* Base segment */}
        <mesh material={antennaMat}>
          <cylinderGeometry args={[0.003, 0.004, 0.05, 3]} />
        </mesh>
        {/* Middle segment - angled */}
        <group position={[0, 0.04, -0.01]} rotation={[0.4, 0, 0]}>
          <mesh material={antennaMat}>
            <cylinderGeometry args={[0.002, 0.003, 0.05, 3]} />
          </mesh>
          {/* Tip bulb */}
          <mesh position={[0, 0.03, 0]} material={antennaTipMat}>
            <sphereGeometry args={[0.004, 4, 3]} />
          </mesh>
        </group>
      </group>

      {/* Right antenna */}
      <group ref={rightAntennaRef} position={[0.02, 0.025, -0.09]} rotation={[0.5, 0, 0.4]}>
        <mesh material={antennaMat}>
          <cylinderGeometry args={[0.003, 0.004, 0.05, 3]} />
        </mesh>
        <group position={[0, 0.04, -0.01]} rotation={[0.4, 0, 0]}>
          <mesh material={antennaMat}>
            <cylinderGeometry args={[0.002, 0.003, 0.05, 3]} />
          </mesh>
          <mesh position={[0, 0.03, 0]} material={antennaTipMat}>
            <sphereGeometry args={[0.004, 4, 3]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

const mouseDown = { current: false }
if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown.current = true })
  window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown.current = false })
}
