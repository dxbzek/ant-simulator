import { useInventoryStore } from '../../stores/inventoryStore'

export default function Hotbar() {
  const hotbar = useInventoryStore((s) => s.hotbar)
  const selectedSlot = useInventoryStore((s) => s.selectedHotbarSlot)

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex gap-1">
        {hotbar.map((item, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-bold
              ${i === selectedSlot
                ? 'border-amber-400 bg-black/70'
                : 'border-white/20 bg-black/50'
              }`}
          >
            {item ? (
              <span className="text-white/90">{item.icon || '?'}</span>
            ) : (
              <span className="text-white/20">{i + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
