import { create } from 'zustand'

export type QuestObjective = 'gather' | 'kill' | 'build' | 'research' | 'explore' | 'reachLevel'

export interface Quest {
  id: string
  name: string
  description: string
  objective: QuestObjective
  target: number
  progress: number
  targetType?: string // e.g., 'food', 'spider', 'barracks'
  rewards: {
    xp?: number
    resources?: Partial<Record<string, number>>
    item?: string
  }
  completed: boolean
}

interface QuestState {
  activeQuests: Quest[]
  completedQuests: string[]

  addQuest: (quest: Quest) => void
  updateProgress: (questId: string, amount: number) => void
  updateQuestsByType: (objective: QuestObjective, targetType: string, amount: number) => void
  completeQuest: (questId: string) => Quest | null
  removeQuest: (questId: string) => void
}

export const useQuestStore = create<QuestState>()((set, get) => ({
  activeQuests: [],
  completedQuests: [],

  addQuest: (quest) =>
    set((s) => ({ activeQuests: [...s.activeQuests, quest] })),

  updateProgress: (questId, amount) =>
    set((s) => ({
      activeQuests: s.activeQuests.map((q) =>
        q.id === questId ? { ...q, progress: Math.min(q.target, q.progress + amount) } : q
      ),
    })),

  updateQuestsByType: (objective, targetType, amount) =>
    set((s) => ({
      activeQuests: s.activeQuests.map((q) =>
        q.objective === objective && q.targetType === targetType && !q.completed
          ? { ...q, progress: Math.min(q.target, q.progress + amount) }
          : q
      ),
    })),

  completeQuest: (questId) => {
    const quest = get().activeQuests.find((q) => q.id === questId)
    if (!quest) return null
    set((s) => ({
      activeQuests: s.activeQuests.filter((q) => q.id !== questId),
      completedQuests: [...s.completedQuests, questId],
    }))
    return quest
  },

  removeQuest: (questId) =>
    set((s) => ({ activeQuests: s.activeQuests.filter((q) => q.id !== questId) })),
}))
