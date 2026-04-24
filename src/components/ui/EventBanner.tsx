import { useWorldStore } from '../../stores/worldStore'

const EVENT_INFO: Record<string, { name: string; color: string; bg: string; summary: string }> = {
  migration: {
    name: '🦗 Migration Season',
    color: 'text-orange-400',
    bg: 'bg-orange-900/40 border-orange-500/50',
    summary: '2× enemy spawns · +5 enemy cap',
  },
  resourceBloom: {
    name: '🌸 Resource Bloom',
    color: 'text-green-400',
    bg: 'bg-green-900/40 border-green-500/50',
    summary: '2× gathering yield',
  },
  invasion: {
    name: '⚔️ Invasion!',
    color: 'text-red-400',
    bg: 'bg-red-900/40 border-red-500/60',
    summary: '+30% enemy stats · 1.5× aggro range',
  },
  plague: {
    name: '☠️ Plague Spreading',
    color: 'text-purple-400',
    bg: 'bg-purple-900/40 border-purple-500/60',
    summary: 'HP drains · stamina -50% · colony shrinking',
  },
  goldenAge: {
    name: '👑 Golden Age',
    color: 'text-amber-300',
    bg: 'bg-amber-900/40 border-amber-400/70',
    summary: '+50% XP · +20% gather · +10% combat stats',
  },
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r}s`
}

export default function EventBanner() {
  const worldEvent = useWorldStore((s) => s.worldEvent)
  const eventTimer = useWorldStore((s) => s.eventTimer)

  if (worldEvent === 'none') return null

  const info = EVENT_INFO[worldEvent]
  if (!info) return null

  return (
    <div className="fixed top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className={`${info.bg} backdrop-blur-sm rounded-lg px-8 py-3 border shadow-lg`}>
        <p className={`${info.color} text-xl font-bold text-center animate-pulse`}>{info.name}</p>
        <p className="text-white/80 text-sm text-center mt-1">{info.summary}</p>
        <p className="text-white/60 text-xs text-center mt-1 font-mono">{formatTime(eventTimer)}</p>
      </div>
    </div>
  )
}
