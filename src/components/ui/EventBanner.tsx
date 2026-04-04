import { useWorldStore } from '../../stores/worldStore'

const EVENT_NAMES: Record<string, { name: string; color: string }> = {
  migration: { name: '🦗 Migration Season', color: 'text-orange-400' },
  resourceBloom: { name: '🌸 Resource Bloom', color: 'text-green-400' },
  invasion: { name: '⚔️ Invasion!', color: 'text-red-400' },
  plague: { name: '☠️ Plague Spreading', color: 'text-purple-400' },
  goldenAge: { name: '👑 Golden Age', color: 'text-amber-400' },
}

export default function EventBanner() {
  const worldEvent = useWorldStore((s) => s.worldEvent)

  if (worldEvent === 'none') return null

  const info = EVENT_NAMES[worldEvent]
  if (!info) return null

  return (
    <div className="fixed top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-pulse">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-8 py-3 border border-white/20">
        <p className={`${info.color} text-xl font-bold text-center`}>{info.name}</p>
      </div>
    </div>
  )
}
