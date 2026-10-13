import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Life } from '../engine/types'
import { ageUp, chooseOption, createLife, type NewLifeOptions } from '../engine/life'

interface GameState {
  life: Life | null
  /** last rolled outcome id, for the UI to show the result line */
  lastOutcome: { eventId: string; choiceId: string; outcomeId?: string } | null
  screen: 'title' | 'game' | 'tombstone'
  newLife: (opts?: NewLifeOptions) => void
  ageUp: () => void
  choose: (choiceId: string) => void
  dismissOutcome: () => void
  toTitle: () => void
  resume: () => void
}

export const useGame = create<GameState>()(
  persist(
    immer((set) => ({
      life: null,
      lastOutcome: null,
      screen: 'title',
      newLife: (opts) =>
        set((s) => {
          s.life = createLife(opts)
          s.lastOutcome = null
          s.screen = 'game'
        }),
      ageUp: () =>
        set((s) => {
          if (!s.life) return
          ageUp(s.life)
          if (!s.life.alive) s.screen = 'tombstone'
        }),
      choose: (choiceId) =>
        set((s) => {
          if (!s.life?.pending) return
          const eventId = s.life.pending.eventId
          const outcomeId = chooseOption(s.life, choiceId)
          s.lastOutcome = { eventId, choiceId, outcomeId }
          if (!s.life.alive) s.screen = 'tombstone'
        }),
      dismissOutcome: () => set((s) => { s.lastOutcome = null }),
      toTitle: () => set((s) => { s.screen = 'title' }),
      resume: () => set((s) => { if (s.life) s.screen = s.life.alive ? 'game' : 'tombstone' }),
    })),
    { name: 'plotline.save.v1' },
  ),
)
