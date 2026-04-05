import { useGameStore } from '../../stores/gameStore'
import { saveGame } from '../../systems/saveLoad'

export default function PauseMenu() {
  const setScreen = useGameStore((s) => s.setScreen)
  const togglePause = useGameStore((s) => s.togglePause)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/90 rounded-xl p-8 min-w-[300px] border border-white/10">
        <h2 className="text-2xl font-bold text-white text-center mb-6">PAUSED</h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={togglePause}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Resume
          </button>
          <button
            onClick={() => {
              saveGame()
            }}
            className="bg-stone-700 hover:bg-stone-600 text-white/80 py-2.5 px-6 rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Save Game
          </button>
          <button
            onClick={() => setScreen('settings')}
            className="bg-stone-700 hover:bg-stone-600 text-white/80 py-2.5 px-6 rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Settings
          </button>
          <button
            onClick={() => {
              saveGame()
              setScreen('mainMenu')
              document.exitPointerLock?.()
            }}
            className="bg-red-900/60 hover:bg-red-800/60 text-red-300 py-2.5 px-6 rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  )
}
