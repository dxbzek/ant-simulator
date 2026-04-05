import { useEffect, useRef } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useColonyStore } from '../../stores/colonyStore'
import { useCombatStore } from '../../stores/combatStore'

const TUTORIAL_STEPS: Record<string, { title: string; text: string; hint: string }> = {
  welcome: {
    title: 'Welcome to Ant Colony!',
    text: 'You are an ant tasked with building and defending a colony. Explore the world, gather resources, and grow your empire!',
    hint: 'Click anywhere to begin',
  },
  movement: {
    title: 'Movement',
    text: 'Use WASD to move, mouse to look around. Hold SHIFT to sprint, SPACE to jump, C to crouch.',
    hint: 'Try walking around to continue',
  },
  gather: {
    title: 'Gathering Resources',
    text: 'Approach glowing objects and press E to gather resources. Different biomes have different resources!',
    hint: 'Gather any resource to continue',
  },
  build: {
    title: 'Building Your Colony',
    text: 'Press B to open the build menu. Place structures to grow your colony. Start with a Nest Entrance!',
    hint: 'Build any structure to continue',
  },
  fight: {
    title: 'Combat',
    text: 'Left-click to attack enemies. Watch out for spiders and beetles! Defeat them for XP and loot.',
    hint: 'Defeat an enemy to complete the tutorial',
  },
}

export default function Tutorial() {
  const tutorialStep = useGameStore((s) => s.tutorialStep)
  const screen = useGameStore((s) => s.screen)
  const completeTutorial = useGameStore((s) => s.completeTutorial)
  const setTutorialStep = useGameStore((s) => s.setTutorialStep)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialRes = useRef<number | null>(null)

  // Auto-advance logic
  useEffect(() => {
    if (!tutorialStep || tutorialStep === 'complete' || screen !== 'playing') return

    const steps = Object.keys(TUTORIAL_STEPS)
    const advance = () => {
      const idx = steps.indexOf(tutorialStep)
      if (idx < steps.length - 1) {
        setTutorialStep(steps[idx + 1] as any)
      } else {
        completeTutorial()
      }
    }

    if (tutorialStep === 'welcome') {
      timerRef.current = setTimeout(advance, 3000)
      return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }

    if (tutorialStep === 'movement') {
      let raf: number
      const check = () => {
        const p = usePlayerStore.getState()
        const dist = Math.sqrt(p.positionX * p.positionX + p.positionZ * p.positionZ)
        if (dist > 5) { advance(); return }
        raf = requestAnimationFrame(check)
      }
      raf = requestAnimationFrame(check)
      return () => cancelAnimationFrame(raf)
    }

    if (tutorialStep === 'gather') {
      const res = useInventoryStore.getState().resources
      initialRes.current = Object.values(res).reduce((a, b) => a + b, 0)
      const unsub = useInventoryStore.subscribe((state) => {
        const total = Object.values(state.resources).reduce((a, b) => a + b, 0)
        if (initialRes.current !== null && total > initialRes.current) {
          advance()
        }
      })
      return unsub
    }

    if (tutorialStep === 'build') {
      const unsub = useColonyStore.subscribe((state) => {
        if (state.buildings.length > 0) advance()
      })
      // Check immediately
      if (useColonyStore.getState().buildings.length > 0) advance()
      return unsub
    }

    if (tutorialStep === 'fight') {
      // Track actual enemy kills by watching enemy count decrease
      let prevEnemyCount = useCombatStore.getState().enemies.length
      const unsub = useCombatStore.subscribe((state) => {
        if (state.enemies.length < prevEnemyCount && prevEnemyCount > 0) {
          advance()
        }
        prevEnemyCount = state.enemies.length
      })
      return unsub
    }
  }, [tutorialStep, screen])

  if (screen !== 'playing' || !tutorialStep || tutorialStep === 'complete') return null

  const step = TUTORIAL_STEPS[tutorialStep]
  if (!step) return null

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-md rounded-xl p-6 max-w-[400px] border border-amber-500/30">
        <h3 className="text-amber-400 font-bold text-lg mb-2">{step.title}</h3>
        <p className="text-white/80 text-sm mb-3">{step.text}</p>
        <p className="text-amber-300/60 text-xs italic">{step.hint}</p>
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={completeTutorial}
            className="text-white/40 hover:text-white/60 text-xs transition-colors"
          >
            Skip Tutorial
          </button>
          <button
            onClick={() => {
              const steps = Object.keys(TUTORIAL_STEPS)
              const idx = steps.indexOf(tutorialStep)
              if (idx < steps.length - 1) {
                setTutorialStep(steps[idx + 1] as any)
              } else {
                completeTutorial()
              }
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium px-4 py-1.5 rounded transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
