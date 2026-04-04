import { useGameStore } from '../../stores/gameStore'
import { useCraftingStore } from '../../stores/craftingStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { RECIPES } from '../../data/recipes'
import { RARITY_COLORS } from '../../utils/colors'

export default function CraftingPanel() {
  const setScreen = useGameStore((s) => s.setScreen)
  const queue = useCraftingStore((s) => s.queue)
  const addToQueue = useCraftingStore((s) => s.addToQueue)
  const hasResources = useInventoryStore((s) => s.hasResources)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[550px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Crafting</h2>
          <button onClick={() => setScreen('playing')} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        {/* Queue */}
        {queue.length > 0 && (
          <div className="mb-4 bg-black/30 rounded-lg p-3">
            <h3 className="text-amber-400 text-xs font-bold uppercase mb-2">Queue ({queue.length})</h3>
            {queue.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                <span>{item.icon}</span>
                <span>{item.name}</span>
                <div className="flex-1 h-1 bg-gray-700 rounded-full">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${item.progress * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recipes */}
        <div className="grid grid-cols-1 gap-2">
          {RECIPES.map((recipe) => {
            const canCraft = hasResources(recipe.cost)
            return (
              <div
                key={recipe.id}
                className={`bg-black/40 rounded-lg p-3 border border-white/10 flex items-center gap-3
                  ${canCraft ? 'hover:border-amber-500/50 cursor-pointer' : 'opacity-50'}`}
                onClick={() => canCraft && addToQueue(recipe)}
              >
                <span className="text-2xl">{recipe.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: RARITY_COLORS[recipe.rarity] || '#fff' }}>
                    {recipe.name}
                  </p>
                  <p className="text-white/40 text-[10px]">{recipe.description}</p>
                  <div className="flex gap-2 mt-1">
                    {Object.entries(recipe.cost).map(([type, amount]) => (
                      <span key={type} className="text-[10px] text-white/50">{type}: {amount}</span>
                    ))}
                  </div>
                </div>
                <span className="text-white/30 text-xs">{recipe.craftTime}s</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
