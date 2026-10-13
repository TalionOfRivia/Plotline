// Loads the data-driven system tables (jobs, assets, crimes, ...).
import jobsData from '../content/systems/jobs.json'
import educationData from '../content/systems/education.json'
import assetsData from '../content/systems/assets.json'
import crimesData from '../content/systems/crimes.json'
import activitiesData from '../content/systems/activities.json'
import ribbonsData from '../content/systems/ribbons.json'
import type { ActivityDef, AssetDef, CrimeDef, JobTrack, RibbonDef } from './types'

export const JOB_TRACKS = (jobsData as { tracks: JobTrack[] }).tracks
export const JOB_BY_ID: Record<string, JobTrack> = Object.fromEntries(JOB_TRACKS.map((t) => [t.id, t]))

export interface Major { id: string; emoji: string; minSmarts: number }
export interface GradSchool { id: string; emoji: string; years: number; cost: number; requiresMajors: string[]; minSmarts: number }
export const EDUCATION = educationData as {
  majors: Major[]
  gradSchools: GradSchool[]
  universityCost: number
  universityYears: number
  scholarshipMinSmarts: number
}

export const ASSETS = assetsData as { houses: AssetDef[]; cars: AssetDef[]; pets: AssetDef[]; luxury: AssetDef[] }
export const ASSET_BY_ID: Record<string, AssetDef & { kind: 'house' | 'car' | 'pet' | 'luxury' }> = Object.fromEntries([
  ...ASSETS.houses.map((a) => [a.id, { ...a, kind: 'house' as const }]),
  ...ASSETS.cars.map((a) => [a.id, { ...a, kind: 'car' as const }]),
  ...ASSETS.pets.map((a) => [a.id, { ...a, kind: 'pet' as const }]),
  ...ASSETS.luxury.map((a) => [a.id, { ...a, kind: 'luxury' as const }]),
])

export const CRIMES = crimesData as CrimeDef[]
export const ACTIVITIES = activitiesData as ActivityDef[]
export const RIBBONS = (ribbonsData as RibbonDef[]).slice().sort((a, b) => a.priority - b.priority)

// System text packs: text/<lang>/sys_*.json
const sysTextModules = import.meta.glob<{ default: Record<string, unknown> }>('../content/text/*/sys_*.json', { eager: true })
export const SYS_TEXT: Record<string, Record<string, Record<string, unknown>>> = {}
for (const [path, mod] of Object.entries(sysTextModules)) {
  const parts = path.split('/')
  const lang = parts.at(-2)!
  const name = parts.at(-1)!.replace(/^sys_/, '').replace(/\.json$/, '')
  SYS_TEXT[lang] ??= {}
  SYS_TEXT[lang][name] = mod.default
}

/** Look up a dotted path in a system text pack, falling back to English then the key. */
export function sysText(lang: string, pack: string, path: string): string {
  const get = (l: string) => path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], SYS_TEXT[l]?.[pack])
  const v = get(lang) ?? get('en')
  return typeof v === 'string' ? v : path.split('.').at(-1)!
}
