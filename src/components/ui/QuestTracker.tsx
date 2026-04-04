import { useQuestStore } from '../../stores/questStore'

export default function QuestTracker() {
  const activeQuests = useQuestStore((s) => s.activeQuests)

  if (activeQuests.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-20 pointer-events-none max-w-[220px]">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
        <h3 className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">Quests</h3>
        {activeQuests.slice(0, 3).map((quest) => (
          <div key={quest.id} className="mb-2 last:mb-0">
            <p className="text-white/90 text-xs font-medium">{quest.name}</p>
            <p className="text-white/50 text-[10px]">
              {quest.progress}/{quest.target} - {quest.description}
            </p>
            <div className="h-1 bg-gray-700 rounded-full mt-1">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(quest.progress / quest.target) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
