// Core data model for a single life. Everything here is plain JSON-serializable
// so a life can be saved, loaded, and unit-tested without React.

export type StatKey = 'happiness' | 'health' | 'smarts' | 'looks'
export type Gender = 'female' | 'male'

export interface Stats {
  happiness: number
  health: number
  smarts: number
  looks: number
}

export type RelationKind =
  | 'mother' | 'father' | 'sibling' | 'friend' | 'partner' | 'spouse' | 'ex' | 'child' | 'pet' | 'grandparent' | 'in_law'

export interface Person {
  id: string
  firstName: string
  lastName: string
  gender: Gender
  age: number
  kind: RelationKind
  /** 0–100 how much they like you */
  relationship: number
  alive: boolean
  /** pets: id in assets.pets */
  species?: string
  /** rough yearly income, for partners/spouses (affects divorce settlements) */
  income?: number
  /** stats of a partner, shown in the date list */
  looks?: number
  smarts?: number
  /** years married (spouse) */
  yearsTogether?: number
  /** 0–100, how unpredictable they are */
  craziness?: number
  /** partner's savings, shown on the prenup card and merged at marriage */
  money?: number
  bestFriend?: boolean
  enemy?: boolean
  engaged?: boolean
  /** adult child who no longer lives with you */
  movedOut?: boolean
  sick?: boolean
}

export interface DiaryEntry {
  age: number
  /** i18n key, literal, or "event:<id>:<choice>[:<outcome>]" */
  text: string
  params?: Record<string, string | number>
  kind: 'event' | 'info' | 'milestone' | 'death' | 'good' | 'bad'
}

export type EducationStage = 'none' | 'primary' | 'high_school' | 'university' | 'grad' | 'done'

export interface Education {
  stage: EducationStage
  /** 0–100 */
  grades: number
  yearsIn: number
  major?: string
  gradSchool?: string
  /** 'high_school' | 'university' | grad school ids */
  degrees: string[]
  loans: number
  dropped?: boolean
}

export interface Job {
  trackId: string
  rung: number
  yearsInTrack: number
  /** 0–100 */
  performance: number
  salary: number
  /** 0–100 */
  stress?: number
  /** 0–100 */
  popularity?: number
  /** weekly hours: 20 part-time, 40 normal, 50 overtime */
  hours?: number
}

export interface OwnedAsset {
  id: string
  /** id in assets.json (house/car/luxury) */
  assetId: string
  kind: 'house' | 'car' | 'luxury'
  value: number
  /** 0–100, cars/houses */
  condition: number
  /** remaining mortgage principal (houses) */
  mortgage: number
  boughtAt: number
}

export interface Prison {
  yearsLeft: number
  served: number
  crimeId: string
  job?: 'laundry' | 'kitchen' | 'library' | 'workshop'
  gang?: boolean
  deathRow?: boolean
}

export interface Business {
  name: string
  kind: string
  value: number
  yearsRunning: number
}

export interface Life {
  id: string
  seed: string
  firstName: string
  lastName: string
  gender: Gender
  country: string
  countryCode: string
  city: string
  age: number
  birthYear: number
  alive: boolean
  causeOfDeath?: string
  stats: Stats
  /** hidden: -100..100 */
  karma: number
  money: number
  people: Person[]
  diary: DiaryEntry[]
  seenEvents: string[]
  flags: Record<string, boolean | number | string>
  pending: PendingEvent | null
  rngCalls: number

  education: Education
  job: Job | null
  retired: boolean
  pension: number
  assets: OwnedAsset[]
  /** 0–100 */
  fame: number
  /** crimes successfully committed + convictions, for ribbons */
  crimes: number
  convictions: number
  prison: Prison | null
  prisonYears: number
  royalty: { rank: 'none' | 'royal' | 'heir' | 'monarch'; popularity: number; title?: string }
  mafia: { rank: number; respect: number } | null
  military: { branch: 'army' | 'navy' | 'air_force' | 'marines'; rank: number; years: number } | null
  /** teachers at the current school */
  teachers: { id: string; name: string; subject: string; relationship: number }[]
  /** past lives (cemetery) live in the store, not here */
  insurance: { home: boolean; car: boolean }
  business: Business | null
  marriages: number
  /** year-by-year listings cache (job ids) so the board is stable within a year */
  jobBoard: string[]
  dateBoard: Person[]
  /** generation number for legacy mode */
  generation: number
  ribbon?: string
  /** outstanding bank loan */
  loan: number
  investments: { index: number; crypto: number }
  /** leave most of the estate to the heir */
  will: boolean
  /** this year's freelance gig offers (ids) */
  gigs: string[]
  /** followers per platform */
  social: Record<string, number>
}

// ---- Content: events --------------------------------------------------------

/** Numeric effects applied by a choice. Stats are clamped to 0..100. */
export interface Effects {
  happiness?: number
  health?: number
  smarts?: number
  looks?: number
  karma?: number
  money?: number
  flags?: Record<string, boolean | number | string>
  relationship?: number
  death?: string
}

export interface Condition {
  minAge?: number
  maxAge?: number
  gender?: Gender
  flags?: string[]
  notFlags?: string[]
  minMoney?: number
  minStats?: Partial<Stats>
  maxStats?: Partial<Stats>
  requiresPerson?: RelationKind
  /** the event is about a person of that kind who has died (funerals, wills) */
  requiresPersonDead?: boolean
  /** real calendar month (1-12) the event is tied to */
  month?: number
}

export interface Choice {
  id: string
  effects?: Effects
  outcomes?: Outcome[]
  showOdds?: boolean
}

export interface Outcome {
  id: string
  weight: number
  effects?: Effects
}

export type EventCategory =
  | 'childhood' | 'school' | 'family' | 'social' | 'health' | 'money' | 'work'
  | 'romance' | 'crime' | 'random' | 'death' | 'fame' | 'royal' | 'mafia' | 'business' | 'sports' | 'space' | 'spy' | 'prison'

export interface GameEvent {
  id: string
  weight?: number
  once?: boolean
  conditions?: Condition
  category: EventCategory
  choices: Choice[]
}

export interface EventText {
  text: string
  choices: Record<string, string>
  outcomes?: Record<string, string>
}
export type EventTextPack = Record<string, EventText>

export interface PendingEvent {
  eventId: string
  personId?: string
}

// ---- Content: systems -------------------------------------------------------

export interface JobTrack {
  id: string
  emoji: string
  requires?: {
    education?: string
    majors?: string[]
    minSmarts?: number
    minLooks?: number
    minHealth?: number
    minAge?: number
  }
  ladder: { id: string; salary: number; minYears: number }[]
}

export interface AssetDef { id: string; emoji: string; price: number; upkeep: number; happiness?: number; looks?: number; lifespan?: number }
export interface CrimeDef {
  id: string; emoji: string; minAge: number; baseSuccess: number; payout: [number, number]
  sentenceYears: [number, number]; karma: number; flags?: Record<string, boolean>; minSmarts?: number
}
export interface ActivityDef { id: string; emoji: string; cost: number; minAge: number; effects?: Effects; risky?: boolean; special?: string }
export interface RibbonDef {
  id: string; emoji: string; priority: number
  when?: {
    minMoney?: number; maxMoney?: number; minAge?: number; maxAge?: number; minKids?: number; minCrimes?: number
    minPrisonYears?: number; flags?: string[]; notFlags?: string[]; maxEvents?: number; minMarriages?: number
    famous?: boolean; royal?: boolean
    karmaMin?: number; karmaMax?: number
    stat?: { name: 'happiness' | 'health' | 'smarts' | 'looks'; min?: number; max?: number }
    counter?: { name: string; min: number }
    minFollowers?: number
  }
}
