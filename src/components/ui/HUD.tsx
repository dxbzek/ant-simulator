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
import Compass from './Compass'
import InteractionPrompt from './InteractionPrompt'
import BuffDisplay from './BuffDisplay'
import ColonyStats from './ColonyStats'
import KeybindHints from './KeybindHints'
import DamageFlash from '../effects/DamageFlash'
import LevelUpEffect from '../effects/LevelUpEffect'

export default function HUD() {
  const isSaving = useGameStore((s) => s.isSaving)
  const showFps = useSettingsStore((s) => s.showFps)

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {isSaving && (
        <div className="fixed top-4 right-4 bg-black/60 text-amber-400 text-xs px-3 py-1.5 rounded-lg animate-pulse">
          Saving...
        </div>
      )}
      <Crosshair />
      <Compass />
      <HealthBar />
      <ResourceDisplay />
      <XPBar />
      <BiomeIndicator />
      <QuestTracker />
      <Hotbar />
      <GameLog />
      <EventBanner />
      <Minimap />
      <ColonyStats />
      <InteractionPrompt />
      <BuffDisplay />
      <KeybindHints />
      <DamageFlash />
      <LevelUpEffect />
      {showFps && <FPSCounter />}
    </div>
  )
}
