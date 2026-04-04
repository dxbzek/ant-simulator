import { usePlayerStore } from '../../stores/playerStore'

export default function XPBar() {
  const xp = usePlayerStore((s) => s.xp)
  const xpToNext = usePlayerStore((s) => s.xpToNext)
  const level = usePlayerStore((s) => s.level)
  const percent = (xp / xpToNext) * 100

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none px-4 pb-1">
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-[10px] font-bold">{level}</span>
        <div className="flex-1 h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-amber-400 text-[10px] font-bold">{level + 1}</span>
      </div>
    </div>
  )
}
