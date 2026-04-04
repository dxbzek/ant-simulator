import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const waterMat = new THREE.MeshLambertMaterial({
  color: '#1a6b8a',
  transparent: true,
  opacity: 0.55,
  side: THREE.FrontSide,
})

export default function Water() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.position.y = -0.5 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05
  })

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, -0.5, 0]}>
      <planeGeometry args={[200, 200]} />
      <primitive object={waterMat} attach="material" />
    </mesh>
  )
}
