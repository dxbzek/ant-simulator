import { useSettingsStore } from '../../stores/settingsStore'
import { useGameStore } from '../../stores/gameStore'

export default function SettingsMenu() {
  const settings = useSettingsStore()
  const setScreen = useGameStore((s) => s.setScreen)
  const previousScreen = useGameStore((s) => s.previousScreen)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-stone-900/95 rounded-xl p-6 w-[450px] max-h-[80vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={() => setScreen(previousScreen === 'settings' ? 'mainMenu' : previousScreen)}
            className="text-white/50 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Mouse */}
        <section className="mb-6">
          <h3 className="text-amber-400 text-sm font-bold uppercase mb-3">Controls</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Mouse Sensitivity</span>
              <input
                type="range"
                min="0.0005"
                max="0.005"
                step="0.0005"
                value={settings.mouseSensitivity}
                onChange={(e) => settings.setMouseSensitivity(parseFloat(e.target.value))}
                className="w-32 accent-amber-500"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Invert Y</span>
              <button
                onClick={() => settings.setInvertY(!settings.invertY)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.invertY ? 'bg-amber-600 text-white' : 'bg-stone-700 text-white/50'
                }`}
              >
                {settings.invertY ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </section>

        {/* Graphics */}
        <section className="mb-6">
          <h3 className="text-amber-400 text-sm font-bold uppercase mb-3">Graphics</h3>
          <div className="flex gap-2">
            {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
              <button
                key={q}
                onClick={() => settings.setGraphicsQuality(q)}
                className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                  settings.graphicsQuality === q
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-700 text-white/50 hover:bg-stone-600'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Audio */}
        <section className="mb-6">
          <h3 className="text-amber-400 text-sm font-bold uppercase mb-3">Audio</h3>
          <div className="space-y-3">
            {[
              { label: 'Master', value: settings.masterVolume, set: settings.setMasterVolume },
              { label: 'Music', value: settings.musicVolume, set: settings.setMusicVolume },
              { label: 'SFX', value: settings.sfxVolume, set: settings.setSfxVolume },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-white/70 text-sm">{s.label}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={s.value}
                  onChange={(e) => s.set(parseFloat(e.target.value))}
                  className="w-32 accent-amber-500"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Display */}
        <section>
          <h3 className="text-amber-400 text-sm font-bold uppercase mb-3">Display</h3>
          <div className="flex justify-between items-center">
            <span className="text-white/70 text-sm">Show FPS</span>
            <button
              onClick={settings.toggleFps}
              className={`px-3 py-1 rounded text-xs font-medium ${
                settings.showFps ? 'bg-amber-600 text-white' : 'bg-stone-700 text-white/50'
              }`}
            >
              {settings.showFps ? 'ON' : 'OFF'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
