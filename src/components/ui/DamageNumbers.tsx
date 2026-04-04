import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

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

function DamageNumber({ event }: { event: DamageEvent }) {
  const progress = event.time / DURATION
  const opacity = Math.max(0, 1 - progress * progress)
  const yOffset = event.time * 0.8

  const color = event.type === 'dealt' ? '#ff4444' : event.type === 'received' ? '#ffaa00' : '#44ff44'
  const scale = 1 + progress * 0.3

  return (
    <group position={[event.x, event.y + yOffset, event.z]}>
      <Html center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color,
            fontSize: `${14 * scale}px`,
            fontWeight: 'bold',
            opacity,
            textShadow: '0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {event.type === 'heal' ? '+' : '-'}{event.value}
        </div>
      </Html>
    </group>
  )
}

export default function DamageNumbers() {
  const [events, setEvents] = useState<DamageEvent[]>([])
  const eventsRef = useRef<DamageEvent[]>([])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    let changed = false

    // Absorb pending events
    while (pendingEvents.length > 0) {
      eventsRef.current.push(pendingEvents.shift()!)
      changed = true
    }

    // Update timers
    const alive: DamageEvent[] = []
    for (const e of eventsRef.current) {
      e.time += dt
      if (e.time < DURATION) {
        alive.push(e)
      } else {
        changed = true
      }
    }

    if (changed || alive.length !== eventsRef.current.length) {
      eventsRef.current = alive
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
