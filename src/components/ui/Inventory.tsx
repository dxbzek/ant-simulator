import { useInventoryStore } from '../../stores/inventoryStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useGameStore } from '../../stores/gameStore'
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
                <div key={slot} className="bg-black/40 rounded-lg p-3 border border-white/10">
                  <p className="text-white/40 text-[10px] uppercase mb-1">{slot}</p>
                  <p className="text-white/80 text-xs">{equipment[slot] || 'Empty'}</p>
                </div>
              ))}
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
        <h3 className="text-amber-400 text-sm font-bold uppercase mt-4 mb-2">Items ({items.length})</h3>
        <div className="grid grid-cols-6 gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-black/40 rounded p-2 border hover:border-amber-500/50 cursor-pointer transition-colors"
              style={{ borderColor: RARITY_COLORS[item.rarity] + '40' }}
              title={`${item.name} (${item.rarity})\n${item.description || ''}`}
              onClick={() => {
                if (item.type === 'weapon' || item.type === 'armor' || item.type === 'helmet' || item.type === 'accessory') {
                  equipItem(item.type, item.id)
                }
              }}
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
      </div>
    </div>
  )
}
