import { useGameStore } from '../../stores/gameStore'
import { useResearchStore } from '../../stores/researchStore'
import { RESEARCH_NODES } from '../../data/research'

export default function ResearchTree() {
  const setScreen = useGameStore((s) => s.setScreen)
  const completed = useResearchStore((s) => s.completed)
  const currentResearch = useResearchStore((s) => s.currentResearch)
  const progress = useResearchStore((s) => s.progress)
  const startResearch = useResearchStore((s) => s.startResearch)

  const categories = ['combat', 'gathering', 'building', 'evolution'] as const

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[650px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Research</h2>
          <button onClick={() => setScreen('playing')} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>

        {currentResearch && (
          <div className="mb-4 bg-amber-900/20 rounded-lg p-3 border border-amber-500/30">
            <p className="text-amber-400 text-sm font-medium">
              Researching: {RESEARCH_NODES.find(n => n.id === currentResearch)?.name || currentResearch}
            </p>
            <div className="h-2 bg-black/40 rounded-full mt-2">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-amber-400 text-xs font-bold uppercase mb-2">{cat}</h3>
              <div className="space-y-1.5">
                {RESEARCH_NODES.filter((n) => n.category === cat).map((node) => {
                  const isComplete = completed.includes(node.id)
                  const prereqsMet = node.prerequisites.every((p) => completed.includes(p))
                  const isActive = currentResearch === node.id
                  const missingPrereqs = node.prerequisites.filter(p => !completed.includes(p))

                  return (
                    <div
                      key={node.id}
                      className={`bg-black/40 rounded p-2 border text-xs cursor-pointer transition-all
                        ${isComplete ? 'border-green-500/50 opacity-60' :
                          isActive ? 'border-amber-500' :
                          prereqsMet ? 'border-white/20 hover:border-amber-500/50' :
                          'border-white/5 opacity-40'}`}
                      onClick={() => !isComplete && prereqsMet && !currentResearch && startResearch(node.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{node.icon}</span>
                        <span className={isComplete ? 'text-green-400' : 'text-white/80'}>{node.name}</span>
                        {isComplete && <span className="text-green-400 ml-auto">✓</span>}
                      </div>
                      <p className="text-white/30 text-[10px] mt-0.5 ml-6">{node.description}</p>
                      <p className="text-white/20 text-[10px] ml-6">Time: {node.researchTime}s</p>
                      {missingPrereqs.length > 0 && !isComplete && (
                        <p className="text-red-400/60 text-[10px] mt-0.5 ml-6">
                          Requires: {missingPrereqs.map(p =>
                            RESEARCH_NODES.find(n => n.id === p)?.name || p
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
