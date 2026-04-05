import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Game from './Game'
import HUD from './components/ui/HUD'
import MainMenu from './components/ui/MainMenu'
import PauseMenu from './components/ui/PauseMenu'
import DeathScreen from './components/ui/DeathScreen'
import Inventory from './components/ui/Inventory'
import BuildMenu from './components/ui/BuildMenu'
import CraftingPanel from './components/ui/CraftingPanel'
import ResearchTree from './components/ui/ResearchTree'
import QuestLog from './components/ui/QuestLog'
import DiplomacyPanel from './components/ui/DiplomacyPanel'
import SettingsMenu from './components/ui/SettingsMenu'
import Tutorial from './components/ui/Tutorial'
import { useGameStore } from './stores/gameStore'
import { useSettingsStore, type GraphicsQuality } from './stores/settingsStore'

const QUALITY_DPR: Record<GraphicsQuality, [number, number]> = {
  low: [0.5, 0.75],
  medium: [0.75, 1],
  high: [1, 1.5],
  ultra: [1, 2],
  auto: [1, 1.5],
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-4xl mb-4">🐜</div>
        <p className="text-white/80 text-lg font-medium">Loading Colony...</p>
        <div className="mt-4 w-48 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-amber-500 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  )
}

function UIOverlays() {
  const screen = useGameStore((s) => s.screen)

  return (
    <>
      {screen === 'mainMenu' && <MainMenu />}
      {screen === 'playing' && <HUD />}
      {screen === 'paused' && <PauseMenu />}
      {screen === 'death' && <DeathScreen />}
      {screen === 'inventory' && <Inventory />}
      {screen === 'buildMenu' && <BuildMenu />}
      {screen === 'craftMenu' && <CraftingPanel />}
      {screen === 'researchMenu' && <ResearchTree />}
      {screen === 'questLog' && <QuestLog />}
      {screen === 'diplomacy' && <DiplomacyPanel />}
      {screen === 'settings' && <SettingsMenu />}
      <Tutorial />
    </>
  )
}

export default function App() {
  const screen = useGameStore((s) => s.screen)
  const quality = useSettingsStore((s) => s.graphicsQuality)
  const showGame = screen !== 'mainMenu'
  const dpr = QUALITY_DPR[quality] || QUALITY_DPR.medium
  const useAA = quality === 'high' || quality === 'ultra'
  const useShadows = quality === 'ultra'

  // Only render Three.js at full framerate when actively playing
  const frameloop = screen === 'playing' ? 'always' : showGame ? 'demand' : 'never'

  return (
    <div className="w-full h-full">
      <Suspense fallback={<LoadingScreen />}>
        {showGame && (
          <Canvas
            shadows={useShadows}
            dpr={dpr}
            camera={{ fov: 85, near: 0.01, far: 120 }}
            gl={{
              antialias: useAA,
              powerPreference: 'high-performance',
              stencil: false,
              depth: true,
            }}
            style={{ position: 'fixed', inset: 0 }}
            frameloop={frameloop}
          >
            <Game />
          </Canvas>
        )}
      </Suspense>
      <UIOverlays />
    </div>
  )
}
