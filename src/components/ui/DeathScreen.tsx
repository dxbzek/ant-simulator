import { usePlayerStore } from '../../stores/playerStore'
import { useGameStore } from '../../stores/gameStore'

export default function DeathScreen() {
  const level = usePlayerStore((s) => s.level)
  const respawn = usePlayerStore((s) => s.respawn)
  const setScreen = useGameStore((s) => s.setScreen)
  const gameTime = useGameStore((s) => s.gameTime)

  const minutes = Math.floor(gameTime / 60)
  const seconds = Math.floor(gameTime % 60)

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-red-400 mb-2">YOU DIED</h2>
        <p className="text-white/50 mb-6">Your colony mourns the loss...</p>

        <div className="bg-black/40 rounded-lg p-4 mb-6 min-w-[250px]">
          <div className="text-white/60 text-sm space-y-1">
            <p>Level reached: <span className="text-amber-400 font-bold">{level}</span></p>
            <p>Time survived: <span className="text-white/80">{minutes}m {seconds}s</span></p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              respawn()
              setScreen('playing')
              // Re-lock pointer so the player can look around immediately
              setTimeout(() => document.querySelector('canvas')?.requestPointerLock(), 50)
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Respawn at Colony
          </button>
          <button
            onClick={() => setScreen('mainMenu')}
            className="bg-stone-700 hover:bg-stone-600 text-white/60 py-2 px-6 rounded-lg transition-all hover:scale-105 active:scale-95 text-sm"
          >
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  )
}
