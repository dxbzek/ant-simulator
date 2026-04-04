import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../stores/worldStore'
import { usePlayerStore } from '../../stores/playerStore'

const RAIN_COUNT = 400
const RAIN_AREA = 20
const RAIN_HEIGHT = 12

export default function Weather() {
  const rainRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(RAIN_COUNT * 3)
    const velocities = new Float32Array(RAIN_COUNT)
    for (let i = 0; i < RAIN_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * RAIN_AREA
      positions[i * 3 + 1] = Math.random() * RAIN_HEIGHT
      positions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA
      velocities[i] = 8 + Math.random() * 8
    }
    return { positions, velocities }
  }, [])

  const rainGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  useFrame((_, delta) => {
    const { weather, weatherIntensity } = useWorldStore.getState()

    if (!rainRef.current) return

    const isRaining = weather === 'rain' || weather === 'storm'
    rainRef.current.visible = isRaining && weatherIntensity > 0.1

    if (!isRaining) return

    const px = usePlayerStore.getState().positionX
    const pz = usePlayerStore.getState().positionZ
    rainRef.current.position.set(px, 0, pz)

    const dt = Math.min(delta, 0.05)
    const speedMult = weather === 'storm' ? 1.5 : 1

    // Direct array access — much faster than getY/setY per element
    for (let i = 0; i < RAIN_COUNT; i++) {
      const yi = i * 3 + 1
      positions[yi] -= velocities[i] * dt * speedMult
      if (positions[yi] < 0) {
        positions[yi] = RAIN_HEIGHT
        positions[i * 3] = (Math.random() - 0.5) * RAIN_AREA
        positions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA
      }
    }
    rainGeo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={rainRef} geometry={rainGeo} frustumCulled={false}>
      <pointsMaterial
        color="#aaccff"
        size={0.06}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
