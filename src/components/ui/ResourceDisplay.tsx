import { useInventoryStore } from '../../stores/inventoryStore'
import { RESOURCE_COLORS } from '../../utils/colors'
import { formatNumber } from '../../utils/math'

const RESOURCE_ICONS: Record<string, string> = {
  food: '🍖',
  wood: '🪵',
  leaves: '🍃',
  minerals: '💎',
  water: '💧',
}

export default function ResourceDisplay() {
  const resources = useInventoryStore((s) => s.resources)

  return (
    <div className="fixed top-4 left-4 z-20 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-white/10">
        <div className="flex gap-3">
          {Object.entries(resources).map(([type, amount]) => (
            <div key={type} className="flex items-center gap-1">
              <span className="text-sm">{RESOURCE_ICONS[type]}</span>
              <span className="text-xs font-medium text-white/90">{formatNumber(amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
