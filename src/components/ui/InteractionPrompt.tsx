import { useEffect, useState } from 'react'
import { nearestResourceRef, gatherProgress } from '../world/ResourceNodes'

export default function InteractionPrompt() {
  const [info, setInfo] = useState<{ type: string; quality: string } | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf: number
    const update = () => {
      const nearest = nearestResourceRef.current
      if (nearest) {
        setInfo({ type: nearest.resourceType, quality: nearest.quality })
      } else {
        setInfo(null)
      }
      setProgress(gatherProgress.current)
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
    Common: 'text-gray-300',
    Uncommon: 'text-green-400',
    Rare: 'text-blue-400',
    Epic: 'text-purple-400',
    Legendary: 'text-amber-400',
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-32 z-20 pointer-events-none">
      <div className="bg-black/70 rounded-lg px-4 py-2 text-center border border-white/10">
        <div className="text-white/90 text-sm font-medium">
          Press <span className="text-amber-400 font-bold">E</span> to gather{' '}
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
