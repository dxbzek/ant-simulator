import { usePlayerStore } from '../../stores/playerStore'

export default function BuffDisplay() {
  const buffs = usePlayerStore((s) => s.activeBuffs)

  if (buffs.length === 0) return null

  return (
    <div className="absolute top-20 left-3 flex flex-col gap-1">
      {buffs.map((buff) => {
        const pct = buff.remaining / buff.duration
        const color = buff.stat === 'attack' ? 'bg-red-500' : buff.stat === 'defense' ? 'bg-blue-500' : 'bg-green-500'
        return (
          <div key={buff.id} className="flex items-center gap-1.5 bg-black/60 rounded px-2 py-0.5">
            <span className="text-white text-[10px] font-bold w-14 truncate">
              {buff.stat === 'attack' ? 'ATK' : buff.stat === 'defense' ? 'DEF' : 'SPD'} +{buff.amount}
            </span>
            <div className="w-12 h-1.5 bg-gray-700 rounded-full">
              <div className={`h-full ${color} rounded-full`} style={{ width: `${pct * 100}%` }} />
            </div>
            <span className="text-white/50 text-[9px]">{Math.ceil(buff.remaining)}s</span>
          </div>
        )
      })}
    </div>
  )
}
