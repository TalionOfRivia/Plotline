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
  | 'mother' | 'father' | 'sibling' | 'friend' | 'partner' | 'spouse' | 'ex' | 'child' | 'pet'

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
  /** job title key, optional */
  job?: string
  /** pets: species emoji */
  species?: string
}

export interface DiaryEntry {
  age: number
  /** i18n key or literal text */
  text: string
  /** interpolation params for the i18n key */
  params?: Record<string, string | number>
  /** 'event' entries came from a choice; 'info' from the simulation */
  kind: 'event' | 'info' | 'milestone' | 'death'
}

export interface Life {
  id: string
  seed: string
  firstName: string
  lastName: string
  gender: Gender
  country: string
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
  /** ids of events already shown, to avoid repeats */
  seenEvents: string[]
  /** free-form flags set by events: "has_license", "expelled", ... */
  flags: Record<string, boolean | number | string>
  /** pending event waiting for the player's choice, if any */
  pending: PendingEvent | null
  /** RNG state so re-loading a save continues the same sequence */
  rngCalls: number
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
  /** set flags; a number/string sets it, `true` sets it, `false` clears it */
  flags?: Record<string, boolean | number | string>
  /** relationship delta with the person the event is about (if any) */
  relationship?: number
  /** kills the character with this cause (i18n key) */
  death?: string
}

export interface Condition {
  minAge?: number
  maxAge?: number
  gender?: Gender
  /** all listed flags must be truthy */
  flags?: string[]
  /** none of these flags may be truthy */
  notFlags?: string[]
  minMoney?: number
  /** each stat must be at least this */
  minStats?: Partial<Stats>
  maxStats?: Partial<Stats>
  /** requires a living person of this kind (the event is "about" them) */
  requiresPerson?: RelationKind
}

export interface Choice {
  /** i18n key under events.<eventId>.choices.<n>.text — or literal */
  id: string
  effects?: Effects
  /** optional probabilistic branch: pick one weighted outcome instead of `effects` */
  outcomes?: Outcome[]
  /** shown in UI if set (0..1), per the "transparent odds" principle */
  showOdds?: boolean
}

export interface Outcome {
  id: string
  weight: number
  effects?: Effects
}

export interface GameEvent {
  id: string
  /** higher = more likely to be picked when eligible (default 1) */
  weight?: number
  /** once = never repeat in one life; default true */
  once?: boolean
  conditions?: Condition
  /** category for balancing & stats; also used as emoji hint */
  category: 'childhood' | 'school' | 'family' | 'social' | 'health' | 'money' | 'work' | 'romance' | 'crime' | 'random' | 'death'
  choices: Choice[]
}

/** Localized text for an event: text + each choice/outcome text, keyed by id. */
export interface EventText {
  text: string
  choices: Record<string, string>
  outcomes?: Record<string, string>
}
export type EventTextPack = Record<string, EventText>

export interface PendingEvent {
  eventId: string
  /** id of the person the event is about, if any */
  personId?: string
}
