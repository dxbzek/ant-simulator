import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
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
  const progress = event.time / DURATION
  const opacity = Math.max(0, 1 - progress * progress)
  const yOffset = event.time * 0.8
  const scale = 0.15 + progress * 0.05

  return (
    <Billboard position={[event.x, event.y + yOffset, event.z]}>
      <Text
        fontSize={scale}
        color={TYPE_COLORS[event.type]}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000000"
        fillOpacity={opacity}
        outlineOpacity={opacity}
      >
        {event.type === 'heal' ? '+' : '-'}{event.value}
      </Text>
    </Billboard>
  )
}

export default function DamageNumbers() {
  const [events, setEvents] = useState<DamageEvent[]>([])
  const eventsRef = useRef<DamageEvent[]>([])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    let structureChanged = false

    // Absorb pending events
    while (pendingEvents.length > 0) {
      eventsRef.current.push(pendingEvents.shift()!)
      structureChanged = true
    }

    // Update timers (mutate in place — DamageNumber reads via ref)
    const alive: DamageEvent[] = []
    for (const e of eventsRef.current) {
      e.time += dt
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
