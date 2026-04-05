import { useColonyStore } from '../../stores/colonyStore'
import { colonyBonuses } from '../../systems/gameLoop'

export default function ColonyStats() {
  const population = useColonyStore((s) => s.population)
  const maxPopulation = useColonyStore((s) => s.maxPopulation)
  const armySize = useColonyStore((s) => s.armySize)
  const buildingCount = useColonyStore((s) => s.buildings.length)

  return (
    <div className="absolute top-[210px] right-3 pointer-events-none">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/5 text-[10px]">
        <div className="text-amber-400/80 font-bold mb-0.5 text-[9px] uppercase">Colony</div>
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between gap-3">
            <span className="text-white/40">Pop</span>
            <span className="text-white/80">{Math.floor(population)}/{maxPopulation}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/40">Army</span>
            <span className="text-white/80">{armySize}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/40">Bldgs</span>
            <span className="text-white/80">{buildingCount}</span>
          </div>
          {colonyBonuses.researchSpeed > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-blue-400/60">Res.Spd</span>
              <span className="text-blue-400/80">+{Math.round(colonyBonuses.researchSpeed * 100)}%</span>
            </div>
          )}
          {colonyBonuses.gatherBonus > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-green-400/60">Gather</span>
              <span className="text-green-400/80">+{Math.round(colonyBonuses.gatherBonus * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
