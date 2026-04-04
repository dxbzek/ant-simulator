import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'

export default function DamageFlash() {
  const [flash, setFlash] = useState(false)
  const prevHp = useRef(usePlayerStore.getState().hp)

  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state) => {
      if (state.hp < prevHp.current) {
        setFlash(true)
        setTimeout(() => setFlash(false), 300)
      }
      prevHp.current = state.hp
    })
    return unsub
  }, [])

  if (!flash) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(200,0,0,0.4) 100%)',
        animation: 'damageFlash 300ms ease-out forwards',
      }}
    />
  )
}
