import { useState } from 'react'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useColonyStore } from '../../stores/colonyStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useQuestStore } from '../../stores/questStore'
import { BUILDINGS, type BuildingDef } from '../../data/buildings'
import { RESOURCE_COLORS } from '../../utils/colors'

export default function BuildMenu() {
  const setScreen = useGameStore((s) => s.setScreen)
  const hasResources = useInventoryStore((s) => s.hasResources)
  const spendResources = useInventoryStore((s) => s.spendResources)
  const addBuilding = useColonyStore((s) => s.addBuilding)
  const player = usePlayerStore()
  const [selected, setSelected] = useState<BuildingDef | null>(null)

  const handleBuild = (building: BuildingDef) => {
    if (!hasResources(building.cost)) return
    if (spendResources(building.cost)) {
      addBuilding({
        id: `${building.id}-${Date.now()}`,
        type: building.id,
        x: player.positionX + Math.sin(player.rotationY) * -3,
        y: 0,
        z: player.positionZ + Math.cos(player.rotationY) * -3,
        level: 1,
        buildProgress: 0,
        isComplete: false,
      })
      useQuestStore.getState().updateQuestsByType('build', building.id, 1)
      useGameLogStore.getState().addMessage(`Building ${building.name}...`, 'system')
      setScreen('playing')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[550px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Build Menu</h2>
          <button onClick={() => setScreen('playing')} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BUILDINGS.map((b) => {
            const canAfford = hasResources(b.cost)
            return (
              <div
                key={b.id}
                className={`bg-black/40 rounded-lg p-3 border cursor-pointer transition-all
                  ${selected?.id === b.id ? 'border-amber-500' : 'border-white/10 hover:border-white/30'}
                  ${canAfford ? '' : 'opacity-50'}`}
                onClick={() => setSelected(b)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-white/90 text-sm font-medium">{b.name}</span>
                </div>
                <p className="text-white/40 text-[10px] mb-2">{b.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(b.cost).map(([type, amount]) => (
                    <span key={type} className="text-[10px]" style={{ color: RESOURCE_COLORS[type as keyof typeof RESOURCE_COLORS] || '#fff' }}>
                      {type}: {amount}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {selected && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleBuild(selected)}
              disabled={!hasResources(selected.cost)}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed
                text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              Build {selected.name}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
