import { useState } from 'react'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { useInventoryStore, type ResourceType } from '../../stores/inventoryStore'
import { useColonyStore } from '../../stores/colonyStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useQuestStore } from '../../stores/questStore'
import { BUILDINGS, type BuildingDef } from '../../data/buildings'
import { RESOURCE_COLORS } from '../../utils/colors'

type Tab = 'build' | 'manage'

export default function BuildMenu() {
  const setScreen = useGameStore((s) => s.setScreen)
  const hasResources = useInventoryStore((s) => s.hasResources)
  const spendResources = useInventoryStore((s) => s.spendResources)
  const addResource = useInventoryStore((s) => s.addResource)
  const addBuilding = useColonyStore((s) => s.addBuilding)
  const buildings = useColonyStore((s) => s.buildings)
  const upgradeBuilding = useColonyStore((s) => s.upgradeBuilding)
  const removeBuilding = useColonyStore((s) => s.removeBuilding)
  const player = usePlayerStore()
  const [selected, setSelected] = useState<BuildingDef | null>(null)
  const [tab, setTab] = useState<Tab>('build')

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

  const getUpgradeCost = (building: BuildingDef, level: number): Partial<Record<ResourceType, number>> => {
    const cost: Partial<Record<ResourceType, number>> = {}
    for (const [type, amount] of Object.entries(building.cost)) {
      cost[type as ResourceType] = Math.ceil((amount || 0) * level)
    }
    return cost
  }

  const handleUpgrade = (buildingId: string, buildingType: string, level: number) => {
    const def = BUILDINGS.find(b => b.id === buildingType)
    if (!def || level >= def.maxLevel) return
    const cost = getUpgradeCost(def, level)
    if (!hasResources(cost)) return
    if (spendResources(cost)) {
      upgradeBuilding(buildingId)
      useGameLogStore.getState().addMessage(`Upgraded ${def.name} to level ${level + 1}!`, 'system')
    }
  }

  const handleDemolish = (buildingId: string, buildingType: string) => {
    const def = BUILDINGS.find(b => b.id === buildingType)
    if (!def) return
    // Refund 50% of base cost
    for (const [type, amount] of Object.entries(def.cost)) {
      if (amount) addResource(type as ResourceType, Math.floor(amount * 0.5))
    }
    removeBuilding(buildingId)
    useGameLogStore.getState().addMessage(`Demolished ${def.name}. 50% resources refunded.`, 'system')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[580px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('build')}
              className={`px-3 py-1.5 rounded text-sm font-bold ${tab === 'build' ? 'bg-amber-600 text-white' : 'bg-stone-700 text-white/50'}`}
            >New Build</button>
            <button
              onClick={() => setTab('manage')}
              className={`px-3 py-1.5 rounded text-sm font-bold ${tab === 'manage' ? 'bg-amber-600 text-white' : 'bg-stone-700 text-white/50'}`}
            >Manage ({buildings.length})</button>
          </div>
          <button onClick={() => setScreen('playing')} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        {tab === 'build' && (
          <>
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
          </>
        )}

        {tab === 'manage' && (
          <div className="space-y-2">
            {buildings.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">No buildings yet. Switch to New Build tab.</p>
            )}
            {buildings.map((b) => {
              const def = BUILDINGS.find(d => d.id === b.type)
              if (!def) return null
              const upgradeCost = getUpgradeCost(def, b.level)
              const canUpgrade = b.isComplete && b.level < def.maxLevel && hasResources(upgradeCost)
              const effectEntries = Object.entries(def.effects).filter(([, v]) => v)
              return (
                <div key={b.id} className="bg-black/40 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{def.icon}</span>
                      <span className="text-white/90 text-sm font-medium">{def.name}</span>
                      <span className="text-amber-400 text-xs">Lv.{b.level}/{def.maxLevel}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {b.level < def.maxLevel && b.isComplete && (
                        <button
                          onClick={() => handleUpgrade(b.id, b.type, b.level)}
                          disabled={!canUpgrade}
                          className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed
                            text-white text-[10px] font-bold px-2 py-1 rounded"
                        >Upgrade</button>
                      )}
                      <button
                        onClick={() => handleDemolish(b.id, b.type)}
                        className="bg-red-800 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded"
                      >Demolish</button>
                    </div>
                  </div>
                  {!b.isComplete && (
                    <div className="mt-1">
                      <div className="h-1.5 bg-gray-800 rounded-full">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${b.buildProgress * 100}%` }} />
                      </div>
                      <p className="text-white/30 text-[9px] mt-0.5">Building... {Math.floor(b.buildProgress * 100)}%</p>
                    </div>
                  )}
                  {b.isComplete && effectEntries.length > 0 && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {effectEntries.map(([key, val]) => (
                        <span key={key} className="text-green-400/70 text-[9px]">
                          +{(val as number) * b.level} {key}
                        </span>
                      ))}
                    </div>
                  )}
                  {b.level < def.maxLevel && b.isComplete && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-white/30 text-[9px]">Upgrade:</span>
                      {Object.entries(upgradeCost).map(([type, amount]) => (
                        <span key={type} className="text-[9px]" style={{ color: RESOURCE_COLORS[type as keyof typeof RESOURCE_COLORS] || '#aaa' }}>
                          {type}: {amount}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
