import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { loadGame, hasSave } from '../../systems/saveLoad'

export default function MainMenu() {
  const startGame = useGameStore((s) => s.startGame)
  const setScreen = useGameStore((s) => s.setScreen)
  const toggleFps = useSettingsStore((s) => s.toggleFps)

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-amber-950 via-stone-900 to-black flex flex-col items-center justify-center">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="text-center mb-12 relative">
        <div className="text-6xl mb-4">🐜</div>
        <h1 className="text-5xl font-bold text-amber-400 tracking-wider drop-shadow-lg">
          ANT COLONY
        </h1>
        <p className="text-amber-200/60 text-lg mt-2 tracking-widest uppercase">
          Survival Simulator
        </p>
        <div className="mt-3 h-[1px] w-48 mx-auto bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-3 w-64 relative">
        <button
          onClick={startGame}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-lg
            transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20
            active:scale-95 tracking-wide"
        >
          NEW GAME
        </button>
        <button
          onClick={() => {
            if (hasSave()) {
              startGame()
              setTimeout(() => loadGame(), 100)
            }
          }}
          className="bg-stone-700 hover:bg-stone-600 text-white/80 font-medium py-3 px-8 rounded-lg
            transition-all duration-200 hover:scale-105 active:scale-95 tracking-wide"
        >
          CONTINUE
        </button>
        <button
          onClick={() => setScreen('settings')}
          className="bg-stone-700 hover:bg-stone-600 text-white/80 font-medium py-3 px-8 rounded-lg
            transition-all duration-200 hover:scale-105 active:scale-95 tracking-wide"
        >
          SETTINGS
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-white/30 text-xs">
        WASD to move | Mouse to look | Click to start
      </div>
    </div>
  )
}
