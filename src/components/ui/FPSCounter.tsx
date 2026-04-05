import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

export function FPSTracker() {
  const frames = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (now - lastTime.current >= 500) {
      const fps = Math.round((frames.current * 1000) / (now - lastTime.current))
      fpsValue.current = fps
      lastTime.current = now
      frames.current = 0
    }
  })

  return null
}

export const fpsValue = { current: 60 }

export default function FPSCounter() {
  const [fps, setFps] = useState(60)

  useEffect(() => {
    const id = window.setInterval(() => {
      setFps(fpsValue.current)
    }, 500)
    return () => window.clearInterval(id)
  }, [])

  const color = fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className={`fixed top-2 right-2 ${color} text-xs font-mono z-50 bg-black/40 px-2 py-1 rounded`}>
      {fps} FPS
    </div>
  )
}
