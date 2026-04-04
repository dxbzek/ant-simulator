import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'

const DIRECTIONS = [
  { label: 'N', angle: 0, major: true },
  { label: 'NE', angle: 45, major: false },
  { label: 'E', angle: 90, major: true },
  { label: 'SE', angle: 135, major: false },
  { label: 'S', angle: 180, major: true },
  { label: 'SW', angle: 225, major: false },
  { label: 'W', angle: 270, major: true },
  { label: 'NW', angle: 315, major: false },
]

export default function Compass() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf: number
    const update = () => {
      if (containerRef.current) {
        const rotY = usePlayerStore.getState().rotationY
        // Convert rotation to degrees (0=North, increases clockwise)
        const degrees = ((rotY * 180 / Math.PI) % 360 + 360) % 360
        containerRef.current.style.transform = `translateX(${-degrees * 1.2}px)`
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Generate direction markers covering -360 to 720 for seamless wrapping
  const markers: { label: string; offset: number; major: boolean }[] = []
  for (let wrap = -1; wrap <= 2; wrap++) {
    for (const dir of DIRECTIONS) {
      markers.push({
        label: dir.label,
        offset: (dir.angle + wrap * 360) * 1.2,
        major: dir.major,
      })
    }
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="relative w-48 h-7 overflow-hidden">
        {/* Center tick */}
        <div className="absolute left-1/2 top-0 w-[2px] h-full bg-amber-400/80 -translate-x-1/2 z-10" />
        {/* Scrolling strip */}
        <div ref={containerRef} className="absolute top-0 left-1/2 flex items-center h-full">
          {markers.map((m, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: `${m.offset}px` }}
            >
              <div className={`w-[1px] ${m.major ? 'h-3 bg-white/60' : 'h-2 bg-white/30'}`} />
              <span className={`text-[9px] leading-none mt-0.5 ${m.major ? 'text-white/80 font-bold' : 'text-white/40'}`}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/60 to-transparent" />
      </div>
    </div>
  )
}
