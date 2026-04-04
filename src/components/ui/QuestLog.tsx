import { useGameStore } from '../../stores/gameStore'
import { useQuestStore } from '../../stores/questStore'

export default function QuestLog() {
  const setScreen = useGameStore((s) => s.setScreen)
  const activeQuests = useQuestStore((s) => s.activeQuests)
  const completedQuests = useQuestStore((s) => s.completedQuests)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Quest Log</h2>
          <button onClick={() => setScreen('playing')} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        <h3 className="text-amber-400 text-sm font-bold uppercase mb-2">Active ({activeQuests.length})</h3>
        {activeQuests.length === 0 && (
          <p className="text-white/30 text-sm mb-4">No active quests</p>
        )}
        <div className="space-y-2 mb-4">
          {activeQuests.map((quest) => (
            <div key={quest.id} className="bg-black/40 rounded-lg p-3 border border-white/10">
              <p className="text-white/90 text-sm font-medium">{quest.name}</p>
              <p className="text-white/40 text-xs mt-1">{quest.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                  />
                </div>
                <span className="text-white/60 text-xs">{quest.progress}/{quest.target}</span>
              </div>
              {quest.rewards.xp && (
                <p className="text-amber-400/60 text-[10px] mt-1">Reward: {quest.rewards.xp} XP</p>
              )}
            </div>
          ))}
        </div>

        <h3 className="text-green-400 text-sm font-bold uppercase mb-2">Completed ({completedQuests.length})</h3>
        <p className="text-white/30 text-xs">{completedQuests.length} quests completed</p>
      </div>
    </div>
  )
}
