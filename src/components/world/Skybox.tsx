import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../stores/worldStore'

const SKY_COLORS = {
  dawn: { top: new THREE.Color(0.3, 0.2, 0.5), bottom: new THREE.Color(0.9, 0.5, 0.3), fog: new THREE.Color(0.8, 0.5, 0.3) },
  day: { top: new THREE.Color(0.3, 0.5, 0.9), bottom: new THREE.Color(0.6, 0.8, 1.0), fog: new THREE.Color(0.7, 0.8, 0.9) },
  dusk: { top: new THREE.Color(0.2, 0.1, 0.4), bottom: new THREE.Color(0.9, 0.3, 0.2), fog: new THREE.Color(0.6, 0.3, 0.3) },
  night: { top: new THREE.Color(0.02, 0.02, 0.08), bottom: new THREE.Color(0.05, 0.05, 0.15), fog: new THREE.Color(0.03, 0.03, 0.08) },
}

export default function Skybox() {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(({ scene }) => {
    const phase = useWorldStore.getState().timeOfDay
    const weather = useWorldStore.getState().weather

    let colors: { top: THREE.Color; bottom: THREE.Color; fog: THREE.Color }
    if (phase === 'dawn') colors = SKY_COLORS.dawn
    else if (phase === 'day') colors = SKY_COLORS.day
    else if (phase === 'dusk') colors = SKY_COLORS.dusk
    else colors = SKY_COLORS.night

    if (matRef.current) {
      matRef.current.uniforms.topColor.value.lerp(colors.top, 0.02)
      matRef.current.uniforms.bottomColor.value.lerp(colors.bottom, 0.02)
    }

    // Fog
    const fogDensity = weather === 'fog' ? 0.015 : weather === 'storm' ? 0.01 : weather === 'rain' ? 0.005 : 0.002
    scene.fog = new THREE.FogExp2(colors.fog.getHex(), fogDensity)
  })

  return (
    <mesh ref={meshRef} scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{
          topColor: { value: new THREE.Color(0.3, 0.5, 0.9) },
          bottomColor: { value: new THREE.Color(0.6, 0.8, 1.0) },
        }}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            float t = max(0.0, h);
            gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
          }
        `}
      />
    </mesh>
  )
}
