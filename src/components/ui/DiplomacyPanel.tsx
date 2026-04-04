import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { useDiplomacyStore } from '../../stores/diplomacyStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { FACTIONS } from '../../data/factions'

export default function DiplomacyPanel() {
  const setScreen = useGameStore((s) => s.setScreen)
  const relations = useDiplomacyStore((s) => s.relations)
  const atWar = useDiplomacyStore((s) => s.atWar)
  const tribute = useDiplomacyStore((s) => s.tribute)

  const handleTrade = (factionId: string) => {
    const inv = useInventoryStore.getState()
    const rel = useDiplomacyStore.getState().relations[factionId] || 0
    if (rel < 0) {
      useGameLogStore.getState().addMessage('Relations too low to trade!', 'system')
      return
    }
    if (inv.resources.minerals >= 10) {
      inv.removeResource('minerals', 10)
      inv.addResource('food', 15)
      inv.addResource('wood', 10)
      useDiplomacyStore.getState().changeRelation(factionId, 5)
      useGameLogStore.getState().addMessage(`Traded with ${factionId}: -10 minerals, +15 food, +10 wood`, 'loot')
    } else {
      useGameLogStore.getState().addMessage('Need 10 minerals to trade!', 'system')
    }
  }

  const handleWar = (factionId: string) => {
    const isAtWar = useDiplomacyStore.getState().atWar.includes(factionId)
    if (isAtWar) {
      useDiplomacyStore.getState().makePeace(factionId)
      useGameLogStore.getState().addMessage(`Made peace with ${factionId}.`, 'system')
    } else {
      useDiplomacyStore.getState().declareWar(factionId)
      useGameLogStore.getState().addMessage(`Declared war on ${factionId}!`, 'combat')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Diplomacy</h2>
          <button onClick={() => setScreen('playing')} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-3">
          {FACTIONS.map((faction) => {
            const relation = relations[faction.id] || 0
            const status = relation > 50 ? 'friendly' : relation > -20 ? 'neutral' : 'hostile'
            const statusColor = status === 'friendly' ? 'text-green-400' : status === 'neutral' ? 'text-yellow-400' : 'text-red-400'

            return (
              <div key={faction.id} className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{faction.icon}</span>
                    <div>
                      <p className="text-white/90 text-sm font-medium">{faction.name}</p>
                      <p className={`text-xs capitalize ${statusColor}`}>{status}</p>
                    </div>
                  </div>
                  <span className="text-white/40 text-xs">Rep: {relation}</span>
                </div>

                {/* Relation bar */}
                <div className="h-1.5 bg-gray-700 rounded-full mb-3">
                  <div
                    className={`h-full rounded-full ${status === 'hostile' ? 'bg-red-500' : status === 'neutral' ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (relation + 100) / 2))}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => tribute(faction.id)}
                    className="bg-stone-700 hover:bg-stone-600 text-white/70 text-xs px-3 py-1 rounded transition-colors"
                  >
                    Tribute
                  </button>
                  <button
                    onClick={() => handleTrade(faction.id)}
                    className="bg-stone-700 hover:bg-stone-600 text-white/70 text-xs px-3 py-1 rounded transition-colors"
                  >
                    Trade
                  </button>
                  <button
                    onClick={() => handleWar(faction.id)}
                    className={`text-xs px-3 py-1 rounded transition-colors ${
                      atWar.includes(faction.id)
                        ? 'bg-green-900/40 hover:bg-green-800/40 text-green-400'
                        : 'bg-red-900/40 hover:bg-red-800/40 text-red-400'
                    }`}
                  >
                    {atWar.includes(faction.id) ? 'Peace' : 'War'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
