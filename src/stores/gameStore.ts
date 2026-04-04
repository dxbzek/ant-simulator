import { create } from 'zustand'

export type GameScreen = 'mainMenu' | 'playing' | 'paused' | 'inventory' | 'buildMenu' | 'craftMenu' | 'researchMenu' | 'questLog' | 'diplomacy' | 'settings' | 'death'

export type TutorialStep = 'welcome' | 'movement' | 'gather' | 'build' | 'fight' | 'complete' | null

interface GameState {
  screen: GameScreen
  previousScreen: GameScreen
  tutorialStep: TutorialStep
  tutorialComplete: boolean
  isSaving: boolean
  gameTime: number // total seconds played
  isPointerLocked: boolean

  setScreen: (screen: GameScreen) => void
  setTutorialStep: (step: TutorialStep) => void
  completeTutorial: () => void
  setSaving: (v: boolean) => void
  tickGameTime: (dt: number) => void
  setPointerLocked: (v: boolean) => void
  startGame: () => void
  togglePause: () => void
}

export const useGameStore = create<GameState>()((set, get) => ({
  screen: 'mainMenu',
  previousScreen: 'mainMenu',
  tutorialStep: 'welcome',
  tutorialComplete: false,
  isSaving: false,
  gameTime: 0,
  isPointerLocked: false,

  setScreen: (screen) => set((s) => ({ screen, previousScreen: s.screen })),
  setTutorialStep: (step) => set({ tutorialStep: step }),
  completeTutorial: () => set({ tutorialStep: 'complete', tutorialComplete: true }),
  setSaving: (v) => set({ isSaving: v }),
  tickGameTime: (dt) => set((s) => ({ gameTime: s.gameTime + dt })),
  setPointerLocked: (v) => set({ isPointerLocked: v }),
  startGame: () => set({ screen: 'playing' }),
  togglePause: () => {
    const s = get()
    if (s.screen === 'playing') set({ screen: 'paused', previousScreen: 'playing' })
    else if (s.screen === 'paused') set({ screen: 'playing' })
    else if (s.screen !== 'mainMenu' && s.screen !== 'death') set({ screen: 'playing' })
  },
}))

// Game log store for event messages
export type LogMessageType = 'info' | 'combat' | 'loot' | 'quest' | 'system'

export interface LogMessage {
  id: number
  text: string
  type: LogMessageType
  time: number
}

let logIdCounter = 0

interface GameLogState {
  messages: LogMessage[]
  addMessage: (text: string, type?: LogMessageType) => void
  clear: () => void
}

export const useGameLogStore = create<GameLogState>()((set) => ({
  messages: [],
  addMessage: (text, type = 'info') =>
    set((s) => ({
      messages: [
        ...s.messages.slice(-20),
        { id: logIdCounter++, text, type, time: Date.now() },
      ],
    })),
  clear: () => set({ messages: [] }),
}))
