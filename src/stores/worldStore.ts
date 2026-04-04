import { create } from 'zustand'

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'
export type Weather = 'clear' | 'rain' | 'fog' | 'storm'
export type WorldEvent = 'none' | 'migration' | 'resourceBloom' | 'invasion' | 'plague' | 'goldenAge'
export type BiomeName = 'forest' | 'garden' | 'cave' | 'desert' | 'swamp'

interface WorldState {
  // Time
  worldTime: number // 0-240 seconds per full cycle
  dayProgress: number // 0-1
  timeOfDay: TimeOfDay
  dayCount: number

  // Weather
  weather: Weather
  weatherTimer: number
  weatherIntensity: number

  // Biome
  currentBiome: BiomeName

  // Events
  worldEvent: WorldEvent
  eventTimer: number

  // Actions
  tick: (dt: number) => void
  setWeather: (w: Weather) => void
  setBiome: (b: BiomeName) => void
  setWorldEvent: (e: WorldEvent, duration: number) => void
}

const DAY_CYCLE_DURATION = 240 // seconds for full day

function getTimeOfDay(progress: number): TimeOfDay {
  if (progress < 0.15) return 'dawn'
  if (progress < 0.5) return 'day'
  if (progress < 0.65) return 'dusk'
  return 'night'
}

const WEATHER_DURATION_RANGE = { min: 30, max: 120 }
const WEATHERS: Weather[] = ['clear', 'clear', 'clear', 'rain', 'fog', 'storm']

export const useWorldStore = create<WorldState>()((set, get) => ({
  worldTime: 60, // start at morning
  dayProgress: 0.25,
  timeOfDay: 'day',
  dayCount: 1,

  weather: 'clear',
  weatherTimer: 60,
  weatherIntensity: 0,

  currentBiome: 'forest',

  worldEvent: 'none',
  eventTimer: 0,

  tick: (dt) => {
    const state = get()
    let worldTime = state.worldTime + dt
    let dayCount = state.dayCount

    if (worldTime >= DAY_CYCLE_DURATION) {
      worldTime -= DAY_CYCLE_DURATION
      dayCount++
    }

    const dayProgress = worldTime / DAY_CYCLE_DURATION
    const timeOfDay = getTimeOfDay(dayProgress)

    // Weather timer
    let weatherTimer = state.weatherTimer - dt
    let weather = state.weather
    let weatherIntensity = state.weatherIntensity
    if (weatherTimer <= 0) {
      weather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)]
      weatherTimer = WEATHER_DURATION_RANGE.min + Math.random() * (WEATHER_DURATION_RANGE.max - WEATHER_DURATION_RANGE.min)
      weatherIntensity = 0
    }

    // Smooth weather intensity ramp
    const targetIntensity = weather === 'clear' ? 0 : 1
    weatherIntensity += (targetIntensity - weatherIntensity) * dt * 0.5

    // World event timer
    let worldEvent = state.worldEvent
    let eventTimer = state.eventTimer
    if (eventTimer > 0) {
      eventTimer -= dt
      if (eventTimer <= 0) {
        worldEvent = 'none'
        eventTimer = 0
      }
    }

    set({
      worldTime, dayProgress, timeOfDay, dayCount,
      weather, weatherTimer, weatherIntensity,
      worldEvent, eventTimer,
    })
  },

  setWeather: (w) => set({ weather: w }),
  setBiome: (b) => set({ currentBiome: b }),
  setWorldEvent: (e, duration) => set({ worldEvent: e, eventTimer: duration }),
}))
