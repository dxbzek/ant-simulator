import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Water() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    // Subtle wave animation through Y position
    meshRef.current.position.y = -0.5 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05
  })

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial
        color="#1a6b8a"
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
