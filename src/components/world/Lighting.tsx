import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../stores/worldStore'

export default function Lighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)

  useFrame(() => {
    const { dayProgress, timeOfDay } = useWorldStore.getState()

    if (!sunRef.current || !ambientRef.current) return

    // Sun position based on day progress (0-1 = full cycle)
    const sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2
    const sunHeight = Math.sin(sunAngle)
    const sunX = Math.cos(sunAngle) * 50
    const sunY = sunHeight * 50
    sunRef.current.position.set(sunX, Math.max(sunY, -10), 20)

    // Lighting intensity based on time of day
    let sunIntensity = 0
    let ambientIntensity = 0
    const sunColor = new THREE.Color()

    switch (timeOfDay) {
      case 'dawn':
        sunIntensity = 0.6
        ambientIntensity = 0.3
        sunColor.set(1, 0.7, 0.4)
        break
      case 'day':
        sunIntensity = 1.2
        ambientIntensity = 0.5
        sunColor.set(1, 0.95, 0.9)
        break
      case 'dusk':
        sunIntensity = 0.5
        ambientIntensity = 0.25
        sunColor.set(1, 0.4, 0.2)
        break
      case 'night':
        sunIntensity = 0.1
        ambientIntensity = 0.1
        sunColor.set(0.3, 0.3, 0.6)
        break
    }

    const weather = useWorldStore.getState().weather
    if (weather === 'storm') {
      sunIntensity *= 0.3
      ambientIntensity *= 0.5
    } else if (weather === 'rain') {
      sunIntensity *= 0.5
      ambientIntensity *= 0.7
    } else if (weather === 'fog') {
      sunIntensity *= 0.6
      ambientIntensity *= 0.8
    }

    sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, sunIntensity, 0.05)
    ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, ambientIntensity, 0.05)
    sunRef.current.color.lerp(sunColor, 0.05)
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} color="#b8c4e0" />
      <directionalLight
        ref={sunRef}
        intensity={1.2}
        position={[50, 50, 20]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.002}
      />
      <hemisphereLight intensity={0.35} color="#87ceeb" groundColor="#3d2817" />
    </>
  )
}
