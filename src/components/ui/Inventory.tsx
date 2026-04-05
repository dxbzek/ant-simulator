import { useState } from 'react'
import { useInventoryStore, type InventoryItem } from '../../stores/inventoryStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { RARITY_COLORS } from '../../utils/colors'

export default function Inventory() {
  const items = useInventoryStore((s) => s.items)
  const equipment = usePlayerStore((s) => s.equipment)
  const equipItem = usePlayerStore((s) => s.equipItem)
  const setScreen = useGameStore((s) => s.setScreen)
  const skills = usePlayerStore((s) => s.skills)
  const skillPoints = usePlayerStore((s) => s.skillPoints)
  const allocateSkill = usePlayerStore((s) => s.allocateSkill)
  const role = usePlayerStore((s) => s.role)
  const level = usePlayerStore((s) => s.level)
  const [hovered, setHovered] = useState<InventoryItem | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Reactive effective stats (update when equipment/buffs change)
  const effectiveAtk = usePlayerStore((s) => s.getEffectiveAttack())
  const effectiveDef = usePlayerStore((s) => s.getEffectiveDefense())
  const effectiveSpd = usePlayerStore((s) => s.getEffectiveSpeed())

  // Resolve equipment IDs to item names
  const getEquipName = (itemId: string | null) => {
    if (!itemId) return 'Empty'
    const item = items.find(i => i.id === itemId)
    return item?.name || itemId.split('-')[0].replace(/_/g, ' ')
  }

  const [targetHotbarSlot, setTargetHotbarSlot] = useState(0)
  const hotbar = useInventoryStore((s) => s.hotbar)

  const handleRightClick = (e: React.MouseEvent, item: InventoryItem) => {
    e.preventDefault()
    if (item.type === 'consumable') {
      const inv = useInventoryStore.getState()
      inv.setHotbarSlot(targetHotbarSlot, { item, icon: item.icon })
      useGameLogStore.getState().addMessage(`Assigned ${item.name} to hotbar slot ${targetHotbarSlot + 1}`, 'system')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Inventory</h2>
          <button onClick={() => setScreen('playing')} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Equipment Slots */}
          <div>
            <h3 className="text-amber-400 text-sm font-bold uppercase mb-2">Equipment</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['weapon', 'armor', 'helmet', 'accessory'] as const).map((slot) => (
                <div key={slot}
                  className={`bg-black/40 rounded-lg p-3 border border-white/10 ${equipment[slot] ? 'cursor-pointer hover:border-red-500/50' : ''}`}
                  onClick={() => { if (equipment[slot]) { equipItem(slot, null); useGameLogStore.getState().addMessage(`Unequipped ${getEquipName(equipment[slot])}`, 'system') } }}
                >
                  <p className="text-white/40 text-[10px] uppercase mb-1">{slot}</p>
                  <p className="text-white/80 text-xs">{getEquipName(equipment[slot])}</p>
                  {equipment[slot] && <p className="text-red-400/50 text-[8px]">click to unequip</p>}
                </div>
              ))}
            </div>
            {/* Effective Stats */}
            <div className="mt-3 bg-black/30 rounded-lg p-3 border border-white/5">
              <p className="text-amber-400/60 text-[10px] uppercase mb-1.5">Effective Stats</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-red-400">ATK</span> <span className="text-white/80">{effectiveAtk}</span></div>
                <div><span className="text-blue-400">DEF</span> <span className="text-white/80">{effectiveDef}</span></div>
                <div><span className="text-green-400">SPD</span> <span className="text-white/80">{effectiveSpd.toFixed(1)}</span></div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-amber-400 text-sm font-bold uppercase mb-2">
              Stats <span className="text-amber-200/40 normal-case">Lv.{level} {role}</span>
            </h3>
            {skillPoints > 0 && (
              <p className="text-green-400 text-xs mb-2">{skillPoints} skill points available!</p>
            )}
            <div className="space-y-1.5">
              {(['attack', 'defense', 'speed', 'health'] as const).map((stat) => (
                <div key={stat} className="flex items-center gap-2">
                  <span className="text-white/60 text-xs capitalize w-16">{stat}</span>
                  <div className="flex-1 h-2 bg-black/40 rounded-full">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, skills[stat] * 5)}%` }}
                    />
                  </div>
                  <span className="text-white/80 text-xs w-6 text-right">{skills[stat]}</span>
                  {skillPoints > 0 && (
                    <button
                      onClick={() => allocateSkill(stat)}
                      className="text-green-400 hover:text-green-300 text-xs font-bold"
                    >+</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {/* Hotbar strip */}
        <div className="mt-4 mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-amber-400 text-sm font-bold uppercase">Hotbar</h3>
            <span className="text-white/30 text-[10px]">Select slot, then right-click a consumable</span>
          </div>
          <div className="flex gap-1.5">
            {hotbar.map((slot, i) => (
              <div
                key={i}
                onClick={() => setTargetHotbarSlot(i)}
                className={`w-12 h-12 bg-black/40 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors
                  ${i === targetHotbarSlot ? 'border-amber-500' : 'border-white/10 hover:border-white/30'}`}
              >
                {slot ? (
                  <span className="text-lg">{slot.icon}</span>
                ) : (
                  <span className="text-white/20 text-xs">{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-amber-400 text-sm font-bold uppercase">Items ({items.length})</h3>
        </div>
        <div className="grid grid-cols-6 gap-1.5 relative">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-black/40 rounded p-2 border hover:border-amber-500/50 cursor-pointer transition-colors"
              style={{ borderColor: RARITY_COLORS[item.rarity] + '40' }}
              onMouseEnter={(e) => { setHovered(item); setMousePos({ x: e.clientX, y: e.clientY }) }}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                if (item.type === 'weapon' || item.type === 'armor' || item.type === 'helmet' || item.type === 'accessory') {
                  equipItem(item.type, item.id)
                }
              }}
              onContextMenu={(e) => handleRightClick(e, item)}
            >
              <div className="text-center text-lg">{item.icon}</div>
              <p className="text-[9px] text-center truncate" style={{ color: RARITY_COLORS[item.rarity] }}>
                {item.name}
              </p>
            </div>
          ))}
          {items.length === 0 && (
            <p className="col-span-6 text-white/30 text-sm text-center py-4">No items yet</p>
          )}
        </div>

        {/* Tooltip */}
        {hovered && (
          <div
            className="fixed z-[60] pointer-events-none bg-stone-800/95 rounded-lg p-3 border border-white/20 shadow-xl max-w-[200px]"
            style={{ left: mousePos.x + 12, top: mousePos.y - 10 }}
          >
            <p className="font-bold text-sm" style={{ color: RARITY_COLORS[hovered.rarity] }}>{hovered.name}</p>
            <p className="text-white/40 text-[10px] capitalize">{hovered.rarity} {hovered.type}</p>
            {hovered.stats && Object.keys(hovered.stats).length > 0 && (
              <div className="mt-1.5 space-y-0.5">
                {Object.entries(hovered.stats).map(([stat, val]) => (
                  <p key={stat} className="text-xs">
                    <span className="text-white/50 capitalize">{stat}:</span>{' '}
                    <span className={val > 0 ? 'text-green-400' : 'text-red-400'}>
                      {val > 0 ? '+' : ''}{val}
                    </span>
                  </p>
                ))}
              </div>
            )}
            {hovered.description && (
              <p className="text-white/40 text-[10px] mt-1.5 italic">{hovered.description}</p>
            )}
            {hovered.type === 'consumable' && (
              <p className="text-amber-400/60 text-[10px] mt-1">Right-click → hotbar</p>
            )}
            {(hovered.type === 'weapon' || hovered.type === 'armor' || hovered.type === 'helmet' || hovered.type === 'accessory') && (
              <p className="text-amber-400/60 text-[10px] mt-1">Click to equip</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
