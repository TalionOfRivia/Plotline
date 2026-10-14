import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Life, Stats } from '../engine/types'
import type { Rng } from '../engine/rng'
import { ageUp, chooseOption, continueAsHeir, createLife, migrateLife, withRng, type NewLifeOptions } from '../engine/life'
import { applyForJob, quitJob, recruiter, reportToHR, retire, setHours, socialize, workHarder } from '../engine/jobs'
import { adoptPet, buyAsset, repairCar, sellAsset } from '../engine/assets'
import { holdWedding, interact, startDating, type Interaction } from '../engine/relationships'
import { commitCrime, type CrimeResult } from '../engine/crime'
import { enrollGrad, enrollUniversity, studyHarder } from '../engine/school'
import { applyAgent, applyAstronaut, joinMafia, sellBusiness, socialMediaPost, startBusiness, type Platform } from '../engine/special'
import { doActivity, type ActivityResult } from '../engine/activities'
import { doGig, emigrate, fertilityTreatment, invest, repayLoan, sue, takeLicense, takeLoan, toggleWill, withdraw, type LicenseKey, type Result } from '../engine/extras'
import { syncDerivedFlags } from '../engine/derived'
import { appeal, escapeResult, joinGang, takePrisonJob, type PrisonJob } from '../engine/prison'
import { deploymentResult, discharge, enlist, type Branch } from '../engine/military'
import { donate, seeDoctor, type DoctorKind } from '../engine/doctors'
import { popularityAction, switchSchool, takeGED, teacherAction, type PopularityAction, type TeacherAction } from '../engine/school'
import { renovate, toggleInsurance } from '../engine/assets'
import { datingApp, surrogacy } from '../engine/relationships'
import { kill } from '../engine/util'
import { checkChallenges } from '../engine/challenges'
import { applyTheme, loadTheme, type Theme } from '../ui/theme'

export type Sheet = null | 'job' | 'assets' | 'people' | 'activities' | 'menu' | 'challenges'

export interface Toast { key: string; params?: Record<string, string | number>; kind: 'good' | 'bad' | 'info' }

interface GameState {
  life: Life | null
  /** snapshot for the "time machine" (undo last year) */
  undo: Life | null
  /** older snapshots, newest first (up to 5 more years back) */
  history: Life[]
  /** past lives */
  cemetery: { name: string; age: number; worth: number; ribbon?: string; cause?: string; generation: number; year: number }[]
  /** mini-game overlay */
  minigame: null | { kind: 'maze' | 'mines'; seed: number }
  /** people the player defined; they show up in future lives */
  customPeople: { first: string; last: string; gender: 'female' | 'male'; kind: 'friend' | 'partner' }[]
  lastOutcome: { eventId: string; choiceId: string; outcomeId?: string } | null
  screen: 'title' | 'setup' | 'game' | 'tombstone'
  sheet: Sheet
  /** challenge ids completed in any life (persists across lives) */
  completedChallenges: string[]
  theme: Theme
  toast: Toast | null
  godMode: boolean

  newLife: (opts?: NewLifeOptions) => void
  toSetup: () => void
  setTheme: (t: Theme) => void
  ageUp: () => void
  undoYear: (yearsBack?: number) => void
  addCustomPerson: (p: { first: string; last: string; gender: 'female' | 'male'; kind: 'friend' | 'partner' }) => void
  removeCustomPerson: (i: number) => void
  setHours: (h: 20 | 40 | 50) => void
  reportHR: () => void
  socialize: () => void
  wedding: (personId: string, venue: string, honeymoon: string) => void
  prisonJob: (job: PrisonJob) => void
  joinGang: () => void
  appeal: () => void
  startEscape: () => void
  finishEscape: (won: boolean) => void
  enlist: (b: Branch) => void
  discharge: () => void
  finishDeployment: (cleared: number, total: number, hitMine: boolean) => void
  doctor: (k: DoctorKind) => void
  donate: (w: 'blood' | 'plasma') => void
  teacher: (id: string, a: TeacherAction) => void
  popularity: (a: PopularityAction) => void
  switchSchool: (priv: boolean) => void
  ged: () => void
  renovate: (id: string) => void
  toggleInsurance: (k: 'home' | 'car') => void
  datingApp: (min: number, max: number) => void
  surrogacy: () => void
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
  crime: (crimeId: string, opts?: { target?: string; accompliceId?: string }) => CrimeResult | null
  enrollUni: (major: string, funding: 'cash' | 'loan' | 'scholarship' | 'parents') => void
  enrollGrad: (gradId: string) => void
  study: () => void
  activity: (id: string) => ActivityResult | null
  post: (platform?: Platform) => void
  joinMafia: () => void
  startBusiness: (kind: string, name: string) => void
  sellBusiness: () => void
  applyAstronaut: () => void
  applyAgent: () => void
  setGodMode: (on: boolean) => void
  extra: (fn: (life: Life, rng: Rng) => Result) => void
  takeLoan: (n: number) => void
  repayLoan: (n: number) => void
  invest: (k: 'index' | 'crypto', n: number) => void
  withdraw: (k: 'index' | 'crypto', n: number) => void
  license: (k: LicenseKey) => void
  emigrate: (code: string) => void
  ivf: () => void
  toggleWill: () => void
  sue: () => void
  gig: (id: string) => void
  setAttraction: (a: 'opposite' | 'same' | 'both') => void
  recruiter: () => void
  repairCar: (id: string) => void
  surrender: () => void
  godEditPerson: (id: string, relationship: number) => void
  godEdit: (patch: { stats?: Partial<Stats>; money?: number; karma?: number; fame?: number }) => void
}

const snapshot = (l: Life): Life => JSON.parse(JSON.stringify(l))

function bury(s: { life: Life | null; cemetery: GameState['cemetery'] }) {
  const l = s.life
  if (!l || s.cemetery.some((c) => c.name === `${l.firstName} ${l.lastName}` && c.age === l.age && c.generation === l.generation)) return
  s.cemetery.unshift({ name: `${l.firstName} ${l.lastName}`, age: l.age, worth: l.money + l.assets.reduce((t, a) => t + a.value - a.mortgage, 0), ribbon: l.ribbon, cause: l.causeOfDeath, generation: l.generation, year: new Date().getFullYear() })
  s.cemetery = s.cemetery.slice(0, 50)
}

export const useGame = create<GameState>()(
  persist(
    immer((set, get) => {
      /** helper: run an action on the live life and refresh derived flags */
      const act = (fn: (life: Life, rng: Rng) => void) =>
        set((s) => { if (s.life && s.life.alive) withRng(s.life, (rng) => fn(s.life!, rng)) })

      return {
        life: null, undo: null, history: [], customPeople: [], cemetery: [], minigame: null, lastOutcome: null, screen: 'title', sheet: null, toast: null, godMode: false, completedChallenges: [], theme: loadTheme(),

        newLife: (opts) => set((s) => { s.life = createLife(opts); s.undo = null; s.lastOutcome = null; s.screen = 'game'; s.sheet = null }),
        toSetup: () => set((s) => { s.screen = 'setup' }),
        setTheme: (t) => { applyTheme(t); set((s) => { s.theme = t }) },
        ageUp: () => set((s) => {
          if (!s.life || !s.life.alive || s.life.pending) return
          if (s.undo) { s.history.unshift(s.undo); s.history = s.history.slice(0, 4) }
          s.undo = snapshot(s.life)
          ageUp(s.life)
          // custom people drift into your life
          if (s.customPeople.length && s.life.age >= 6) withRng(s.life, (rng) => { for (const cp of s.customPeople) { if (s.life!.people.some((p) => p.firstName === cp.first && p.lastName === cp.last)) continue; if (!rng.chance(0.12)) continue; if (cp.kind === 'friend') { s.life!.people.push({ id: 'cp' + Date.now().toString(36) + rng.int(0, 9999), firstName: cp.first, lastName: cp.last, gender: cp.gender, age: s.life!.age + rng.int(-3, 3), kind: 'friend', relationship: rng.int(55, 85), alive: true, looks: rng.bell(20, 100), smarts: rng.bell(20, 100), craziness: rng.bell(0, 100) }); s.life!.diary.push({ age: s.life!.age, kind: 'good', text: 'people.newFriend', params: { name: cp.first } }) } else if (s.life!.age >= 18 && !s.life!.dateBoard.some((d) => d.firstName === cp.first)) { s.life!.dateBoard.unshift({ id: 'cp' + Date.now().toString(36) + rng.int(0, 9999), firstName: cp.first, lastName: cp.last, gender: cp.gender, age: s.life!.age + rng.int(-4, 4), kind: 'partner', relationship: rng.int(50, 75), alive: true, looks: rng.bell(40, 100), smarts: rng.bell(30, 100), craziness: rng.bell(0, 100), income: rng.int(20_000, 120_000), money: rng.int(0, 100_000) }) } } })
          if (s.life.flags.deploy_now) { delete s.life.flags.deploy_now; s.minigame = { kind: 'mines', seed: Date.now() % 100000 } }
          const fresh = checkChallenges(s.life, s.completedChallenges)
          if (fresh.length) { s.completedChallenges.push(...fresh); s.toast = { key: 'challenge.toast', params: { id: fresh[0] }, kind: 'good' } }
          if (!s.life.alive) { s.screen = 'tombstone'; bury(s) }
        }),
        undoYear: (yearsBack = 1) => set((s) => {
          const chain = [s.undo, ...s.history].filter(Boolean) as Life[]
          const target = chain[Math.min(yearsBack, chain.length) - 1]
          if (!target) return
          s.life = target; s.undo = null; s.history = chain.slice(yearsBack); s.lastOutcome = null; s.screen = 'game'; s.sheet = null
        }),
        addCustomPerson: (p) => set((s) => { if (s.customPeople.length < 20) s.customPeople.push(p) }),
        removeCustomPerson: (i) => set((s) => { s.customPeople.splice(i, 1) }),
        setHours: (h) => act((l) => setHours(l, h)),
        reportHR: () => act((l, rng) => { const r = reportToHR(l, rng); if (r) get().setToast({ key: r === 'win' ? 'work.hrWin' : 'work.hrLose', kind: r === 'win' ? 'good' : 'bad' }) }),
        socialize: () => act((l, rng) => socialize(l, rng)),
        prisonJob: (job) => act((l) => takePrisonJob(l, job)),
        joinGang: () => act((l, rng) => joinGang(l, rng)),
        appeal: () => act((l, rng) => appeal(l, rng)),
        startEscape: () => set((s) => { if (s.life?.prison) s.minigame = { kind: 'maze', seed: Date.now() % 100000 } }),
        finishEscape: (won) => set((s) => { s.minigame = null; if (s.life) withRng(s.life, () => escapeResult(s.life!, won)); s.sheet = null }),
        enlist: (b) => act((l) => { if (!enlist(l, b)) get().setToast({ key: 'military.cant', kind: 'bad' }) }),
        discharge: () => act((l) => discharge(l, true)),
        finishDeployment: (cleared, total, hit) => set((s) => { s.minigame = null; if (s.life) { withRng(s.life, (rng) => deploymentResult(s.life!, cleared, total, hit, rng)); if (!s.life.alive) { s.screen = 'tombstone'; bury(s) } } }),
        doctor: (k) => get().extra((l, rng) => seeDoctor(l, k, rng)),
        donate: (w) => get().extra((l) => donate(l, w)),
        teacher: (id, a) => act((l, rng) => get().setToast({ key: teacherAction(l, id, a, rng), kind: 'info' })),
        popularity: (a) => act((l, rng) => get().setToast({ key: popularityAction(l, a, rng), kind: 'info' })),
        switchSchool: (priv) => act((l) => { if (!switchSchool(l, priv)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        ged: () => act((l, rng) => takeGED(l, rng)),
        renovate: (id) => act((l) => { if (!renovate(l, id)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        toggleInsurance: (k) => act((l) => toggleInsurance(l, k)),
        datingApp: (min, max) => act((l, rng) => { if (!datingApp(l, rng, min, max)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        surrogacy: () => act((l, rng) => { if (!surrogacy(l, rng)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        wedding: (personId, venue, honeymoon) => act((l) => { if (!holdWedding(l, personId, venue, honeymoon)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        choose: (choiceId) => set((s) => {
          if (!s.life?.pending) return
          const eventId = s.life.pending.eventId
          const outcomeId = chooseOption(s.life, choiceId)
          s.lastOutcome = { eventId, choiceId, outcomeId }
          if (s.life.flags.deploy_now) { delete s.life.flags.deploy_now; s.minigame = { kind: 'mines', seed: Date.now() % 100000 } }
          if (!s.life.alive) { s.screen = 'tombstone'; bury(s) }
        }),
        dismissOutcome: () => set((s) => { s.lastOutcome = null }),
        toTitle: () => set((s) => { s.screen = 'title'; s.sheet = null }),
        resume: () => set((s) => { if (s.life) s.screen = s.life.alive ? 'game' : 'tombstone' }),
        openSheet: (sheet) => set((s) => { s.sheet = sheet }),
        setToast: (t) => set((s) => { s.toast = t }),
        continueAs: (heirId) => set((s) => { if (s.life) { s.life = continueAsHeir(s.life, heirId); s.undo = null; s.screen = 'game'; s.sheet = null } }),
        importLife: (life) => set((s) => { s.life = migrateLife(life); syncDerivedFlags(s.life); s.screen = life.alive ? 'game' : 'tombstone' }),

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
        crime: (crimeId, opts) => {
          let result: CrimeResult | null = null
          act((l, rng) => { result = commitCrime(l, crimeId, rng, opts) })
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
        post: (platform = 'photo') => act((l, rng) => { const viral = socialMediaPost(l, rng, platform); get().setToast({ key: viral ? 'fame.viral' : 'fame.posted', kind: viral ? 'good' : 'info' }) }),
        joinMafia: () => act((l) => joinMafia(l)),
        startBusiness: (kind, name) => act((l) => { if (!startBusiness(l, kind, name)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        sellBusiness: () => act((l) => sellBusiness(l)),
        applyAstronaut: () => act((l, rng) => { const ok = applyAstronaut(l, rng); get().setToast({ key: ok ? 'space.accepted' : 'space.rejected', kind: ok ? 'good' : 'bad' }) }),
        applyAgent: () => act((l, rng) => { const ok = applyAgent(l, rng); get().setToast({ key: ok ? 'agent.recruited' : 'agent.rejected', kind: ok ? 'good' : 'bad' }) }),
        extra: (fn) => act((l, rng) => { const r = fn(l, rng); get().setToast({ key: r.key, kind: r.kind, params: { money: r.money ?? 0 } }) }),
        takeLoan: (n) => get().extra((l) => takeLoan(l, n)),
        repayLoan: (n) => get().extra((l) => repayLoan(l, n)),
        invest: (k, n) => get().extra((l) => invest(l, k, n)),
        withdraw: (k, n) => get().extra((l) => withdraw(l, k, n)),
        license: (k) => get().extra((l, rng) => takeLicense(l, k, rng)),
        emigrate: (code) => get().extra((l, rng) => emigrate(l, code, rng)),
        ivf: () => get().extra((l) => fertilityTreatment(l)),
        toggleWill: () => get().extra((l) => toggleWill(l)),
        sue: () => get().extra((l, rng) => sue(l, rng)),
        gig: (id) => get().extra((l, rng) => doGig(l, id, rng)),
        setAttraction: (a) => act((l) => { l.flags.attraction = a; l.dateBoard = [] }),
        surrender: () => set((s) => { if (!s.life?.alive) return; s.undo = snapshot(s.life); withRng(s.life, () => kill(s.life!, 'death.surrender')); s.screen = 'tombstone'; s.sheet = null }),
        repairCar: (id) => act((l) => { if (!repairCar(l, id)) get().setToast({ key: 'assets.toast.cantAfford', kind: 'bad' }) }),
        recruiter: () => act((l, rng) => { const id = recruiter(l, rng); get().setToast({ key: id ? 'work.recruiterFound' : 'work.recruiterNone', kind: id ? 'good' : 'bad' }) }),
        godEditPerson: (id, relationship) => set((s) => { const p = s.life?.people.find((x) => x.id === id); if (p) p.relationship = relationship }),
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
      version: 2,
      migrate: (state) => { const s = state as GameState; if (s.life) migrateLife(s.life); if (s.undo) migrateLife(s.undo); s.history ??= []; s.customPeople ??= []; s.cemetery ??= []; return s },
      merge: (persisted, current) => { const p = persisted as Partial<GameState>; if (p.life) migrateLife(p.life); if (p.undo) migrateLife(p.undo); return { ...current, ...p } },
      partialize: (s) => ({ life: s.life, undo: s.undo, history: s.history, customPeople: s.customPeople, cemetery: s.cemetery, screen: s.screen === 'setup' ? 'title' : s.screen, godMode: s.godMode, completedChallenges: s.completedChallenges, theme: s.theme }) as GameState,
    },
  ),
)
