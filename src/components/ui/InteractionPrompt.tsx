import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { nearestResourceRef, gatherProgress } from '../world/ResourceNodes'

export default function InteractionPrompt() {
  const interactKey = useSettingsStore((s) => s.keybinds.interact)
  const [info, setInfo] = useState<{ type: string; quality: string } | null>(null)
  const [progress, setProgress] = useState(0)

  const prevInfoRef = useRef<{ type: string; quality: string } | null>(null)
  const prevProgressRef = useRef(0)

  useEffect(() => {
    let raf: number
    const update = () => {
      const nearest = nearestResourceRef.current
      if (nearest) {
        if (!prevInfoRef.current || prevInfoRef.current.type !== nearest.resourceType || prevInfoRef.current.quality !== nearest.quality) {
          const next = { type: nearest.resourceType, quality: nearest.quality }
          prevInfoRef.current = next
          setInfo(next)
        }
      } else if (prevInfoRef.current !== null) {
        prevInfoRef.current = null
        setInfo(null)
      }
      const gp = gatherProgress.current
      if (gp !== prevProgressRef.current) {
        prevProgressRef.current = gp
        setProgress(gp)
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!info) return null

  const typeLabels: Record<string, string> = {
    food: 'Food',
    wood: 'Wood',
    leaves: 'Leaves',
    minerals: 'Minerals',
    water: 'Water',
  }

  const qualityColors: Record<string, string> = {
    common: 'text-gray-300',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-amber-400',
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-32 z-20 pointer-events-none">
      <div className="bg-black/70 rounded-lg px-4 py-2 text-center border border-white/10">
        <div className="text-white/90 text-sm font-medium">
          Press <span className="text-amber-400 font-bold">{interactKey.replace('Key', '').replace('Digit', '')}</span> to gather{' '}
          <span className="text-amber-300">{typeLabels[info.type] || info.type}</span>
          {' '}
          <span className={qualityColors[info.quality] || 'text-gray-300'}>({info.quality})</span>
        </div>
        {progress > 0 && (
          <div className="mt-1.5 w-40 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
