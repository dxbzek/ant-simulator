import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'

export default function LevelUpEffect() {
  const [show, setShow] = useState(false)
  const [level, setLevel] = useState(1)
  const prevLevel = useRef(usePlayerStore.getState().level)

  useEffect(() => {
    // Set prevLevel inside effect to avoid false trigger after loadGame
    prevLevel.current = usePlayerStore.getState().level
    const unsub = usePlayerStore.subscribe((state) => {
      if (state.level > prevLevel.current) {
        setLevel(state.level)
        setShow(true)
        setTimeout(() => setShow(false), 2000)
      }
      prevLevel.current = state.level
    })
    return unsub
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center">
      {/* Golden flash */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)',
          animation: 'levelFlash 2s ease-out forwards',
        }}
      />
      {/* Level up text */}
      <div
        className="text-center"
        style={{ animation: 'levelText 2s ease-out forwards' }}
      >
        <div className="text-amber-400 text-3xl font-bold drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(255,215,0,0.6)' }}>
          LEVEL UP!
        </div>
        <div className="text-white text-lg font-medium mt-1" style={{ textShadow: '0 0 10px rgba(255,255,255,0.4)' }}>
          Level {level}
        </div>
      </div>
      <style>{`
        @keyframes levelFlash {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes levelText {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          15% { opacity: 1; transform: scale(1.1) translateY(0); }
          30% { transform: scale(1) translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: scale(1) translateY(-30px); }
        }
      `}</style>
    </div>
  )
}
