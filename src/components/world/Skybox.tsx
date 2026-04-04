import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../stores/worldStore'

const SKY_COLORS = {
  dawn: { top: '#4d3380', bottom: '#e68050', fog: '#cc8050' },
  day: { top: '#4d80e6', bottom: '#99ccff', fog: '#b3cce6' },
  dusk: { top: '#331a66', bottom: '#e64d33', fog: '#994d4d' },
  night: { top: '#050514', bottom: '#0d0d26', fog: '#080814' },
}

export default function Skybox() {
  useFrame(({ scene }) => {
    const phase = useWorldStore.getState().timeOfDay
    const weather = useWorldStore.getState().weather

    const colors = SKY_COLORS[phase]
    const fogColor = new THREE.Color(colors.fog)
    const bgColor = new THREE.Color(colors.top)

    // Fog
    const fogDensity = weather === 'fog' ? 0.02 : weather === 'storm' ? 0.015 : weather === 'rain' ? 0.008 : 0.004
    scene.fog = new THREE.FogExp2(fogColor.getHex(), fogDensity)
    scene.background = bgColor
  })

  return null
}
