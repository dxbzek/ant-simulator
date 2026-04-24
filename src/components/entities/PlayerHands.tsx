import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerStore } from '../../stores/playerStore'

// Shared materials — reddish-brown ant chitin
const mandibleMat = new THREE.MeshLambertMaterial({ color: '#3a1f10' })
const mandibleTipMat = new THREE.MeshLambertMaterial({ color: '#1a0a04' })
const headMat = new THREE.MeshLambertMaterial({ color: '#4a2412' })
const antennaMat = new THREE.MeshLambertMaterial({ color: '#3a2010' })
const antennaTipMat = new THREE.MeshLambertMaterial({ color: '#6a4028' })

// Shared geometries — 8 radial segments so cones don't read as flat triangles
const mandibleBaseGeo = new THREE.CylinderGeometry(0.004, 0.0012, 0.045, 8)
const mandibleTipGeo = new THREE.ConeGeometry(0.0018, 0.02, 8)
const headGeo = new THREE.SphereGeometry(0.06, 12, 8)
const antennaSegGeo = new THREE.CylinderGeometry(0.0012, 0.0018, 0.04, 6)
const antennaSegGeo2 = new THREE.CylinderGeometry(0.0008, 0.0012, 0.03, 6)
const antennaTipGeo = new THREE.SphereGeometry(0.002, 6, 4)

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
      leftRef.current.position.y = -0.05 + bob
      rightRef.current.position.y = -0.05 + bob

      if (isAttacking) {
        const snap = Math.sin(t * 16) * 0.5 + 0.5
        leftRef.current.rotation.z = -0.55 + snap * 0.4
        rightRef.current.rotation.z = 0.55 - snap * 0.4
      } else {
        leftRef.current.rotation.z = -0.35 + Math.sin(t * 1.5) * 0.025
        rightRef.current.rotation.z = 0.35 - Math.sin(t * 1.5) * 0.025
      }
    }

    // Antenna sway
    if (leftAntennaRef.current && rightAntennaRef.current) {
      const sway = Math.sin(t * 2) * 0.04
      const sway2 = Math.cos(t * 1.7) * 0.03
      leftAntennaRef.current.rotation.x = 0.45 + sway
      leftAntennaRef.current.rotation.z = -0.45 + sway2
      rightAntennaRef.current.rotation.x = 0.45 + sway
      rightAntennaRef.current.rotation.z = 0.45 - sway2
    }
  })

  return (
    <group ref={groupRef}>
      {/* Subtle head-underside visual — hints at the ant's own face below the camera */}
      <mesh material={headMat} geometry={headGeo} position={[0, -0.11, -0.05]} scale={[1, 0.55, 0.9]} />

      {/* Left mandible — curved inward like a real ant mandible */}
      <group ref={leftRef} position={[-0.028, -0.05, -0.12]} rotation={[0.35, 0.15, -0.35]}>
        <mesh material={mandibleMat} geometry={mandibleBaseGeo} />
        <mesh
          material={mandibleTipMat}
          geometry={mandibleTipGeo}
          position={[0.008, -0.028, -0.001]}
          rotation={[0.2, 0, -0.6]}
        />
      </group>

      {/* Right mandible — mirror of left */}
      <group ref={rightRef} position={[0.028, -0.05, -0.12]} rotation={[0.35, -0.15, 0.35]}>
        <mesh material={mandibleMat} geometry={mandibleBaseGeo} />
        <mesh
          material={mandibleTipMat}
          geometry={mandibleTipGeo}
          position={[-0.008, -0.028, -0.001]}
          rotation={[0.2, 0, 0.6]}
        />
      </group>

      {/* Left antenna */}
      <group ref={leftAntennaRef} position={[-0.018, 0.015, -0.095]} rotation={[0.45, 0, -0.45]}>
        <mesh material={antennaMat} geometry={antennaSegGeo} />
        <group position={[0, 0.028, -0.006]} rotation={[0.3, 0, 0]}>
          <mesh material={antennaMat} geometry={antennaSegGeo2} />
          <mesh position={[0, 0.018, 0]} material={antennaTipMat} geometry={antennaTipGeo} />
        </group>
      </group>

      {/* Right antenna */}
      <group ref={rightAntennaRef} position={[0.018, 0.015, -0.095]} rotation={[0.45, 0, 0.45]}>
        <mesh material={antennaMat} geometry={antennaSegGeo} />
        <group position={[0, 0.028, -0.006]} rotation={[0.3, 0, 0]}>
          <mesh material={antennaMat} geometry={antennaSegGeo2} />
          <mesh position={[0, 0.018, 0]} material={antennaTipMat} geometry={antennaTipGeo} />
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
