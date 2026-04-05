import { useMemo } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { EQUIPMENT } from '../../data/equipment'

export default function HealthBar() {
  const hp = usePlayerStore((s) => s.hp)
  const baseMaxHp = usePlayerStore((s) => s.maxHp)
  const stamina = usePlayerStore((s) => s.stamina)
  const maxStamina = usePlayerStore((s) => s.maxStamina)
  const level = usePlayerStore((s) => s.level)
  const role = usePlayerStore((s) => s.role)
  const equipment = usePlayerStore((s) => s.equipment)
  const equipHpBonus = useMemo(() => {
    let bonus = 0
    for (const slot of Object.values(equipment)) {
      if (!slot) continue
      const equip = EQUIPMENT.find(e => slot.replace(/-\d+$/, '') === e.id)
      if (equip?.stats?.hp) bonus += equip.stats.hp
    }
    return bonus
  }, [equipment])
  const maxHp = baseMaxHp + equipHpBonus

  const hpPercent = (hp / maxHp) * 100
  const staminaPercent = (stamina / maxStamina) * 100
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="fixed bottom-4 left-4 z-20 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 min-w-[200px] border border-white/10">
        {/* Level & Role */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-amber-400 font-bold text-sm">Lv.{level}</span>
          <span className="text-white/60 text-xs uppercase tracking-wider">{role}</span>
        </div>

        {/* HP */}
        <div className="mb-1.5">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-red-400 font-medium">HP</span>
            <span className="text-white/80">{Math.ceil(hp)}/{maxHp}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${hpColor} rounded-full transition-all duration-300`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Stamina */}
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-blue-400 font-medium">STA</span>
            <span className="text-white/80">{Math.ceil(stamina)}/{maxStamina}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${staminaPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
