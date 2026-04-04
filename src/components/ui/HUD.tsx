import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import HealthBar from './HealthBar'
import Crosshair from './Crosshair'
import FPSCounter from './FPSCounter'
import ResourceDisplay from './ResourceDisplay'
import XPBar from './XPBar'
import BiomeIndicator from './BiomeIndicator'
import QuestTracker from './QuestTracker'
import Hotbar from './Hotbar'
import GameLog from './GameLog'
import EventBanner from './EventBanner'
import Minimap from './Minimap'

export default function HUD() {
  const screen = useGameStore((s) => s.screen)
  const showFps = useSettingsStore((s) => s.showFps)

  if (screen !== 'playing') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <Crosshair />
      <HealthBar />
      <ResourceDisplay />
      <XPBar />
      <BiomeIndicator />
      <QuestTracker />
      <Hotbar />
      <GameLog />
      <EventBanner />
      <Minimap />
      {showFps && <FPSCounter />}
    </div>
  )
}
