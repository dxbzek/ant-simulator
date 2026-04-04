import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_KEYBINDS, type KeybindConfig } from '../data/keybinds'

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra' | 'auto'

interface SettingsState {
  mouseSensitivity: number
  invertY: boolean
  graphicsQuality: GraphicsQuality
  keybinds: KeybindConfig
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  showFps: boolean

  setMouseSensitivity: (v: number) => void
  setInvertY: (v: boolean) => void
  setGraphicsQuality: (q: GraphicsQuality) => void
  setKeybind: (action: keyof KeybindConfig, key: string) => void
  resetKeybinds: () => void
  setMasterVolume: (v: number) => void
  setMusicVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  toggleFps: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mouseSensitivity: 0.002,
      invertY: false,
      graphicsQuality: 'high',
      keybinds: { ...DEFAULT_KEYBINDS },
      masterVolume: 0.8,
      musicVolume: 0.5,
      sfxVolume: 0.7,
      showFps: false,

      setMouseSensitivity: (v) => set({ mouseSensitivity: v }),
      setInvertY: (v) => set({ invertY: v }),
      setGraphicsQuality: (q) => set({ graphicsQuality: q }),
      setKeybind: (action, key) =>
        set((state) => ({
          keybinds: { ...state.keybinds, [action]: key },
        })),
      resetKeybinds: () => set({ keybinds: { ...DEFAULT_KEYBINDS } }),
      setMasterVolume: (v) => set({ masterVolume: v }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      toggleFps: () => set((s) => ({ showFps: !s.showFps })),
    }),
    { name: 'ant-sim-settings' }
  )
)
