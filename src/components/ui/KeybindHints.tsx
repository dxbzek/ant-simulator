const HINTS = [
  { key: 'I', label: 'Inventory' },
  { key: 'B', label: 'Build' },
  { key: 'K', label: 'Craft' },
  { key: 'R', label: 'Research' },
  { key: 'J', label: 'Quests' },
  { key: 'F', label: 'Use Item' },
]

export default function KeybindHints() {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
      <div className="flex gap-2 bg-black/30 rounded-lg px-2 py-1">
        {HINTS.map((h) => (
          <div key={h.key} className="flex items-center gap-0.5">
            <span className="text-amber-400/60 text-[9px] font-mono bg-white/5 rounded px-1">{h.key}</span>
            <span className="text-white/30 text-[8px]">{h.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
