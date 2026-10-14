import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Section, Sheet } from './Sheet'
import { CHALLENGES, challengeProgress } from '../engine/challenges'
import { sysText } from '../engine/systems'

const TIER_EMOJI = { easy: '🟢', medium: '🟡', hard: '🔴', legendary: '💎', achievement: '🏅' } as const

export function ChallengesSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const done = useGame((s) => s.completedChallenges)
  const lang = i18n.language
  const tiers = ['easy', 'medium', 'hard', 'legendary', 'achievement'] as const
  const week = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / (7 * 86_400_000))
  const pool = CHALLENGES.filter((c) => c.tier !== 'achievement')
  const featured = pool.length ? pool[week % pool.length] : null

  return (
    <Sheet title={t('challenge.title')} emoji="🏆">
      <p className="text-xs opacity-70 px-1 mb-3">{t('challenge.hint', { done: done.length, total: CHALLENGES.length })}</p>
      {featured && <div className="bg-accent text-on-accent rounded-2xl p-3 mb-3 shadow-sm"><div className="text-xs uppercase tracking-widest opacity-80">{t('challenge.featured')}</div><div className="font-bold">{featured.emoji} {sysText(lang, 'challenges', `${featured.id}.name`)}</div><div className="text-xs opacity-80">{sysText(lang, 'challenges', `${featured.id}.blurb`)}</div></div>}
      {tiers.map((tier) => {
        const list = CHALLENGES.filter((c) => c.tier === tier)
        if (!list.length) return null
        return (
          <Section key={tier} title={`${TIER_EMOJI[tier]} ${t(`challenge.tier.${tier}`)}`}>
            {list.map((c) => {
              const finished = done.includes(c.id)
              const { met, total } = challengeProgress(life, c)
              return (
                <div key={c.id} className={`flex items-center gap-3 bg-card rounded-2xl px-3 py-3 mb-2 shadow-sm ${finished ? 'ring-2 ring-accent' : ''}`}>
                  <span className="text-2xl w-8 text-center">{finished ? '✅' : c.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold">{sysText(lang, 'challenges', `${c.id}.name`)}</span>
                    <span className="block text-xs opacity-70">{sysText(lang, 'challenges', `${c.id}.blurb`)}</span>
                    {!finished && (
                      <span className="block mt-1 h-1.5 rounded-full bg-fg/10 overflow-hidden">
                        <span className="block h-full bg-accent transition-[width]" style={{ width: `${(met / total) * 100}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums opacity-70">{finished ? t('challenge.done') : `${met}/${total}`}</span>
                </div>
              )
            })}
          </Section>
        )
      })}
    </Sheet>
  )
}
