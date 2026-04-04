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
  const showGame = screen !== 'mainMenu'

  return (
    <div className="w-full h-full">
      <Suspense fallback={<LoadingScreen />}>
        {showGame && (
          <Canvas
            shadows={false}
            dpr={[1, 1.5]}
            camera={{ fov: 85, near: 0.01, far: 120 }}
            gl={{
              antialias: false,
              powerPreference: 'high-performance',
              stencil: false,
              depth: true,
            }}
            style={{ position: 'fixed', inset: 0 }}
            frameloop="always"
          >
            <Game />
          </Canvas>
        )}
      </Suspense>
      <UIOverlays />
    </div>
  )
}
