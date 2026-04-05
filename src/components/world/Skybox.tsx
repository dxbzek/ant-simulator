import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../stores/worldStore'

const SKY_COLORS = {
  dawn: { top: '#4d3380', bottom: '#e68050', fog: '#cc8050' },
  day: { top: '#4d80e6', bottom: '#99ccff', fog: '#b3cce6' },
  dusk: { top: '#331a66', bottom: '#e64d33', fog: '#994d4d' },
  night: { top: '#050514', bottom: '#0d0d26', fog: '#080814' },
}

// Cached color/fog objects — reused every frame
const _fogColor = new THREE.Color()
const _bgColor = new THREE.Color()
let _cachedFog: THREE.FogExp2 | null = null

function Stars() {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 150
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = Math.abs(r * Math.cos(phi))
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const phase = useWorldStore.getState().timeOfDay
    const visible = phase === 'night' || phase === 'dusk'
    pointsRef.current.visible = visible
    if (visible) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.001
      const mat = pointsRef.current.material as THREE.PointsMaterial
      mat.opacity = phase === 'night' ? 0.9 : 0.3
    }
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.4} sizeAttenuation transparent opacity={0.9} />
    </points>
  )
}

export default function Skybox() {
  // Reset fog singleton on Canvas remount so stale fog isn't reused across sessions
  useEffect(() => () => { _cachedFog = null }, [])

  useFrame(({ scene }) => {
    const { timeOfDay, weather } = useWorldStore.getState()
    const colors = SKY_COLORS[timeOfDay]

    _fogColor.set(colors.fog)
    _bgColor.set(colors.top)

    const fogDensity = weather === 'fog' ? 0.02 : weather === 'storm' ? 0.015 : weather === 'rain' ? 0.008 : 0.004

    if (!_cachedFog) {
      _cachedFog = new THREE.FogExp2(_fogColor.getHex(), fogDensity)
      scene.fog = _cachedFog
    } else {
      _cachedFog.color.copy(_fogColor)
      _cachedFog.density = fogDensity
    }
    if (!scene.background || !(scene.background instanceof THREE.Color)) {
      scene.background = new THREE.Color()
    }
    ;(scene.background as THREE.Color).copy(_bgColor)
  })

  return <Stars />
}
