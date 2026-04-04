import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../stores/worldStore'
import { usePlayerStore } from '../../stores/playerStore'

const RAIN_COUNT = 800
const RAIN_AREA = 25
const RAIN_HEIGHT = 15

export default function Weather() {
  const rainRef = useRef<THREE.Points>(null)

  const rainGeo = useMemo(() => {
    const positions = new Float32Array(RAIN_COUNT * 3)
    const velocities = new Float32Array(RAIN_COUNT)
    for (let i = 0; i < RAIN_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * RAIN_AREA
      positions[i * 3 + 1] = Math.random() * RAIN_HEIGHT
      positions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA
      velocities[i] = 8 + Math.random() * 8
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1))
    return geo
  }, [])

  useFrame((_, delta) => {
    const weather = useWorldStore.getState().weather
    const intensity = useWorldStore.getState().weatherIntensity

    if (!rainRef.current) return

    const isRaining = weather === 'rain' || weather === 'storm'
    rainRef.current.visible = isRaining && intensity > 0.1

    if (!isRaining) return

    const px = usePlayerStore.getState().positionX
    const pz = usePlayerStore.getState().positionZ
    rainRef.current.position.set(px, 0, pz)

    const positions = rainGeo.attributes.position as THREE.BufferAttribute
    const velocities = rainGeo.attributes.velocity as THREE.BufferAttribute
    const dt = Math.min(delta, 0.05)

    for (let i = 0; i < RAIN_COUNT; i++) {
      let y = positions.getY(i)
      y -= velocities.getX(i) * dt * (weather === 'storm' ? 1.5 : 1)
      if (y < 0) {
        y = RAIN_HEIGHT
        positions.setX(i, (Math.random() - 0.5) * RAIN_AREA)
        positions.setZ(i, (Math.random() - 0.5) * RAIN_AREA)
      }
      positions.setY(i, y)
    }
    positions.needsUpdate = true
  })

  return (
    <points ref={rainRef} geometry={rainGeo}>
      <pointsMaterial
        color="#aaccff"
        size={0.08}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
