import type { Life } from './types'
import { JOB_BY_ID } from './systems'

const FAME_TRACKS = new Set(['actor', 'musician', 'professional_athlete', 'influencer', 'model', 'politician', 'music_producer', 'movie_director', 'fighter'])

/** Recompute flags that content packs rely on. Call every year and after player actions. */
export function syncDerivedFlags(life: Life) {
  const f = life.flags
  const set = (k: string, v: boolean) => { if (v) f[k] = true; else delete f[k] }
  const partner = life.people.find((p) => p.kind === 'partner' && p.alive)
  const spouse = life.people.find((p) => p.kind === 'spouse' && p.alive)
  const kids = life.people.filter((p) => p.kind === 'child' && p.alive)

  set('student', life.education.stage === 'primary' || life.education.stage === 'high_school')
  set('university', life.education.stage === 'university')
  set('grad_school', life.education.stage === 'grad')
  set('has_degree', life.education.degrees.some((d) => d !== 'high_school'))
  set('has_high_school', life.education.degrees.includes('high_school'))
  set('employed', Boolean(life.job))
  set('unemployed', !life.job && life.age >= 18 && !life.retired && !life.prison && life.education.stage !== 'university' && life.education.stage !== 'grad')
  set('retired', life.retired)
  set('high_performer', Boolean(life.job && life.job.performance > 70))
  set('low_performer', Boolean(life.job && life.job.performance < 35))
  set('dating', Boolean(partner))
  set('married', Boolean(spouse))
  set('single', !partner && !spouse && life.age >= 18)
  set('has_kids', kids.length > 0)
  set('rich', life.money > 1_000_000)
  set('has_house', life.assets.some((a) => a.kind === 'house'))
  set('in_prison', Boolean(life.prison))
  set('criminal_record', life.convictions > 0)
  set('famous', life.fame >= 50)
  set('celebrity', life.fame >= 80)
  set('fame_career', Boolean(life.job && FAME_TRACKS.has(life.job.trackId)))
  set('athlete', life.job?.trackId === 'professional_athlete' || life.job?.trackId === 'fighter')
  set('stressed', Boolean(life.job && (life.job.stress ?? 0) > 70))
  set('popular_at_work', Boolean(life.job && (life.job.popularity ?? 0) > 70))
  set('best_friend', life.people.some((p) => p.bestFriend && p.alive))
  set('enemy', life.people.some((p) => p.enemy && p.alive))
  set('convictions_3', life.convictions >= 3)
  set('many_cats', life.people.filter((p) => p.kind === 'pet' && p.alive && (p.species === 'cat' || p.species === 'rescue_cat')).length >= 5)
  set('two_grad_degrees', life.education.degrees.filter((d) => d.startsWith('grad_')).length >= 2)
  set('gold_digger', life.people.some((p) => p.kind === 'spouse' && p.alive && (p.income ?? 0) > 3 * Math.max(20_000, (life.job?.salary ?? 0) + life.pension)))
  set('phd', life.education.degrees.some((d) => d.startsWith('grad_')))
  set('pet_owner', life.people.some((p) => p.kind === 'pet'))
  set('owns_private_island', life.assets.some((a) => a.assetId === 'private_island'))
  set('owns_jet', life.assets.some((a) => a.assetId === 'jet'))
  set('owns_hypercar', life.assets.some((a) => a.assetId === 'hypercar'))
  set('owns_art_collection', life.assets.some((a) => a.assetId === 'art_collection'))
  set('never_married', life.marriages === 0)
  set('married_once', life.marriages === 1 && !life.flags.divorced)
  set('royal', life.royalty.rank !== 'none')
  set('monarch', life.royalty.rank === 'monarch')
  set('heir', life.royalty.rank === 'heir')
  set('mafia', Boolean(life.mafia))
  set('mafia_boss', Boolean(life.mafia && life.mafia.rank >= 5))
  set('business_owner', Boolean(life.business))
  set('business_big', Boolean(life.business && life.business.value > 10_000_000))
  set('never_worked', !life.flags.ever_worked)
  // 'addicted' and 'std' are set directly by events/activities; nothing to derive
  if (life.job && !JOB_BY_ID[life.job.trackId]) life.job = null
}
