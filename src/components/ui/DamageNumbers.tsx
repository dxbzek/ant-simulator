import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Billboard, Text } from '@react-three/drei'

interface DamageEvent {
  id: number
  value: number
  x: number
  y: number
  z: number
  type: 'dealt' | 'received' | 'heal'
  time: number
}

const DURATION = 1.2
let nextId = 0
const pendingEvents: DamageEvent[] = []

export function spawnDamageNumber(x: number, y: number, z: number, value: number, type: 'dealt' | 'received' | 'heal' = 'dealt') {
  pendingEvents.push({ id: nextId++, value: Math.ceil(value), x, y, z, type, time: 0 })
}

const TYPE_COLORS = {
  dealt: '#ff4444',
  received: '#ffaa00',
  heal: '#44ff44',
}

function DamageNumber({ event }: { event: DamageEvent }) {
  const groupRef = useRef<THREE.Group>(null)
  const textRef = useRef<any>(null)

  // Imperative animation — no React re-renders needed
  useFrame((_, delta) => {
    event.time += Math.min(delta, 0.05)
    if (!groupRef.current) return
    const progress = event.time / DURATION
    // Animate the wrapper group Y, not the Billboard itself (Billboard overrides its own transform)
    groupRef.current.position.y = event.time * 0.8
    const opacity = Math.max(0, 1 - progress * progress)
    if (textRef.current) {
      textRef.current.fillOpacity = opacity
      textRef.current.outlineOpacity = opacity
    }
  })

  return (
    <group ref={groupRef} position={[event.x, event.y, event.z]}>
      <Billboard>
        <Text
          ref={textRef}
          fontSize={0.15}
          color={TYPE_COLORS[event.type]}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
          fillOpacity={1}
          outlineOpacity={1}
        >
          {event.type === 'heal' ? '+' : '-'}{event.value}
        </Text>
      </Billboard>
    </group>
  )
}

export default function DamageNumbers() {
  const [events, setEvents] = useState<DamageEvent[]>([])
  const eventsRef = useRef<DamageEvent[]>([])

  // Reset on Canvas remount
  useEffect(() => {
    pendingEvents.length = 0
    eventsRef.current = []
    nextId = 0
  }, [])

  useFrame(() => {
    let structureChanged = false

    // Absorb pending events
    while (pendingEvents.length > 0) {
      eventsRef.current.push(pendingEvents.shift()!)
      structureChanged = true
    }

    // Remove expired (animation is driven by each DamageNumber's own useFrame)
    const alive: DamageEvent[] = []
    for (const e of eventsRef.current) {
      if (e.time < DURATION) {
        alive.push(e)
      } else {
        structureChanged = true
      }
    }
    eventsRef.current = alive

    // Only trigger React re-render when events are added or removed
    if (structureChanged) {
      setEvents([...alive])
    }
  })

  return (
    <group>
      {events.map((e) => (
        <DamageNumber key={e.id} event={e} />
      ))}
    </group>
  )
}
