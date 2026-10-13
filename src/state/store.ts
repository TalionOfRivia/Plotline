import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Life, Stats } from '../engine/types'
import type { Rng } from '../engine/rng'
import { ageUp, chooseOption, continueAsHeir, createLife, withRng, type NewLifeOptions } from '../engine/life'
import { applyForJob, quitJob, retire, workHarder } from '../engine/jobs'
import { adoptPet, buyAsset, sellAsset } from '../engine/assets'
import { interact, startDating, type Interaction } from '../engine/relationships'
import { commitCrime, type CrimeResult } from '../engine/crime'
import { enrollGrad, enrollUniversity, studyHarder } from '../engine/school'
import { applyAgent, applyAstronaut, joinMafia, sellBusiness, socialMediaPost, startBusiness } from '../engine/special'
import { doActivity, type ActivityResult } from '../engine/activities'
import { syncDerivedFlags } from '../engine/derived'

export type Sheet = null | 'job' | 'assets' | 'people' | 'activities' | 'menu' | 'education' | 'crime' | 'special'

export interface Toast { key: string; params?: Record<string, string | number>; kind: 'good' | 'bad' | 'info' }

interface GameState {
  life: Life | null
  /** snapshot for the "time machine" (undo last year) */
  undo: Life | null
  lastOutcome: { eventId: string; choiceId: string; outcomeId?: string } | null
  screen: 'title' | 'game' | 'tombstone'
  sheet: Sheet
  toast: Toast | null
  godMode: boolean

  newLife: (opts?: NewLifeOptions) => void
  ageUp: () => void
  undoYear: () => void
  choose: (choiceId: string) => void
  dismissOutcome: () => void
  toTitle: () => void
  resume: () => void
  openSheet: (s: Sheet) => void
  setToast: (t: Toast | null) => void
  continueAs: (heirId: string) => void
  importLife: (life: Life) => void

  // actions (all run through the life's RNG so they're reproducible)
  applyJob: (trackId: string) => void
  quitJob: () => void
  workHarder: () => void
  retire: () => void
  buy: (assetId: string, mortgage?: boolean) => void
  sell: (ownedId: string) => void
  adoptPet: (petId: string) => void
  interact: (personId: string, kind: Interaction) => void
  date: (candidateId: string) => void
  crime: (crimeId: string) => CrimeResult | null
  enrollUni: (major: string, funding: 'cash' | 'loan' | 'scholarship') => void
  enrollGrad: (gradId: string) => void
  study: () => void
  activity: (id: string) => ActivityResult | null
  post: () => void
  joinMafia: () => void
  startBusiness: (kind: string, name: string) => void
  sellBusiness: () => void
  applyAstronaut: () => void
  applyAgent: () => void
  setGodMode: (on: boolean) => void
  godEdit: (patch: { stats?: Partial<Stats>; money?: number; karma?: number; fame?: number }) => void
}

const snapshot = (l: Life): Life => JSON.parse(JSON.stringify(l))

export const useGame = create<GameState>()(
  persist(
    immer((set, get) => {
      /** helper: run an action on the live life and refresh derived flags */
      const act = (fn: (life: Life, rng: Rng) => void) =>
        set((s) => { if (s.life && s.life.alive) withRng(s.life, (rng) => fn(s.life!, rng)) })

      return {
        life: null, undo: null, lastOutcome: null, screen: 'title', sheet: null, toast: null, godMode: false,

        newLife: (opts) => set((s) => { s.life = createLife(opts); s.undo = null; s.lastOutcome = null; s.screen = 'game'; s.sheet = null }),
        ageUp: () => set((s) => {
          if (!s.life || !s.life.alive || s.life.pending) return
          s.undo = snapshot(s.life)
          ageUp(s.life)
          if (!s.life.alive) s.screen = 'tombstone'
        }),
        undoYear: () => set((s) => { if (s.undo) { s.life = s.undo; s.undo = null; s.lastOutcome = null; s.screen = 'game' } }),
        choose: (choiceId) => set((s) => {
          if (!s.life?.pending) return
          const eventId = s.life.pending.eventId
          const outcomeId = chooseOption(s.life, choiceId)
          s.lastOutcome = { eventId, choiceId, outcomeId }
          if (!s.life.alive) s.screen = 'tombstone'
        }),
        dismissOutcome: () => set((s) => { s.lastOutcome = null }),
        toTitle: () => set((s) => { s.screen = 'title'; s.sheet = null }),
        resume: () => set((s) => { if (s.life) s.screen = s.life.alive ? 'game' : 'tombstone' }),
        openSheet: (sheet) => set((s) => { s.sheet = sheet }),
        setToast: (t) => set((s) => { s.toast = t }),
        continueAs: (heirId) => set((s) => { if (s.life) { s.life = continueAsHeir(s.life, heirId); s.undo = null; s.screen = 'game'; s.sheet = null } }),
        importLife: (life) => set((s) => { s.life = life; syncDerivedFlags(s.life); s.screen = life.alive ? 'game' : 'tombstone' }),

        applyJob: (trackId) => act((l, rng) => {
          const r = applyForJob(l, trackId, rng)
          get().setToast({ key: `work.toast.${r}`, kind: r === 'hired' ? 'good' : 'bad' })
        }),
        quitJob: () => act((l) => quitJob(l)),
        workHarder: () => act((l) => { workHarder(l); get().setToast({ key: 'work.toast.harder', kind: 'info' }) }),
        retire: () => act((l) => retire(l)),
        buy: (assetId, mortgage) => act((l) => { if (!buyAsset(l, assetId, mortgage)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        sell: (ownedId) => act((l) => sellAsset(l, ownedId)),
        adoptPet: (petId) => act((l, rng) => { if (!adoptPet(l, petId, rng)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        interact: (personId, kind) => act((l, rng) => {
          const key = interact(l, personId, kind, rng)
          const p = l.people.find((x) => x.id === personId)
          get().setToast({ key, params: { name: p?.firstName ?? '' }, kind: key.includes('_no') || key.includes('rejected') || key.includes('broke') ? 'bad' : 'info' })
        }),
        date: (candidateId) => act((l, rng) => {
          const c = l.dateBoard.find((x) => x.id === candidateId)
          if (c) { const ok = startDating(l, c, rng); get().setToast({ key: ok ? 'people.newPartner' : 'people.rejected', params: { name: c.firstName }, kind: ok ? 'good' : 'bad' }) }
        }),
        crime: (crimeId) => {
          let result: CrimeResult | null = null
          act((l, rng) => { result = commitCrime(l, crimeId, rng) })
          const s = get()
          if (s.life && !s.life.alive) set((st) => { st.screen = 'tombstone' })
          return result
        },
        enrollUni: (major, funding) => act((l, rng) => { if (!enrollUniversity(l, major, rng, funding)) get().setToast({ key: 'school.toast.cantEnroll', kind: 'bad' }) }),
        enrollGrad: (gradId) => act((l) => enrollGrad(l, gradId)),
        study: () => act((l) => { studyHarder(l); get().setToast({ key: 'school.toast.studied', kind: 'info' }) }),
        activity: (id) => {
          let result: ActivityResult | null = null
          act((l, rng) => { result = doActivity(l, id, rng) })
          const s = get()
          if (s.life && !s.life.alive) set((st) => { st.screen = 'tombstone' })
          return result
        },
        post: () => act((l, rng) => { const viral = socialMediaPost(l, rng); get().setToast({ key: viral ? 'fame.viral' : 'fame.posted', kind: viral ? 'good' : 'info' }) }),
        joinMafia: () => act((l) => joinMafia(l)),
        startBusiness: (kind, name) => act((l) => { if (!startBusiness(l, kind, name)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        sellBusiness: () => act((l) => sellBusiness(l)),
        applyAstronaut: () => act((l, rng) => { const ok = applyAstronaut(l, rng); get().setToast({ key: ok ? 'space.accepted' : 'space.rejected', kind: ok ? 'good' : 'bad' }) }),
        applyAgent: () => act((l, rng) => { const ok = applyAgent(l, rng); get().setToast({ key: ok ? 'agent.recruited' : 'agent.rejected', kind: ok ? 'good' : 'bad' }) }),
        setGodMode: (on) => set((s) => { s.godMode = on }),
        godEdit: (patch) => set((s) => {
          if (!s.life) return
          if (patch.stats) Object.assign(s.life.stats, patch.stats)
          if (patch.money !== undefined) s.life.money = patch.money
          if (patch.karma !== undefined) s.life.karma = patch.karma
          if (patch.fame !== undefined) s.life.fame = patch.fame
          syncDerivedFlags(s.life)
        }),
      }
    }),
    {
      name: 'plotline.save.v2',
      partialize: (s) => ({ life: s.life, undo: s.undo, screen: s.screen, godMode: s.godMode }) as GameState,
    },
  ),
)
