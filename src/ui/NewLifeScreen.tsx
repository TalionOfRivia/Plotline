import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { NAMES, randomName } from '../engine/people'
import { Rng, newSeed } from '../engine/rng'
import type { Gender } from '../engine/types'

const FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', IL: '🇮🇱', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱',
  SE: '🇸🇪', PL: '🇵🇱', BR: '🇧🇷', MX: '🇲🇽', AR: '🇦🇷', JP: '🇯🇵', KR: '🇰🇷', IN: '🇮🇳', ZA: '🇿🇦', NG: '🇳🇬',
}

/** Character creation: name, gender, country. Everything can be re-rolled. */
export function NewLifeScreen() {
  const { t } = useTranslation()
  const newLife = useGame((s) => s.newLife)
  const toTitle = useGame((s) => s.toTitle)
  const [gender, setGender] = useState<Gender>(() => (Math.random() < 0.5 ? 'female' : 'male'))
  const [country, setCountry] = useState(() => NAMES.countries[Math.floor(Math.random() * NAMES.countries.length)].code)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [seed, setSeed] = useState(newSeed)

  // a suggestion that follows the chosen country/gender until the player types
  const suggestion = useMemo(() => randomName(new Rng(seed + country + gender), country, gender), [seed, country, gender])
  const firstName = first.trim() || suggestion.first
  const lastName = last.trim() || suggestion.last
  const c = NAMES.countries.find((x) => x.code === country)!

  return (
    <main className="h-full overflow-y-auto flex flex-col px-5 safe-top safe-bottom anim-fade">
      <header className="flex items-center gap-2 py-3">
        <button onClick={toTitle} className="text-2xl px-2 active:opacity-60">‹</button>
        <h1 className="font-extrabold text-xl flex-1">{t('setup.title')}</h1>
      </header>

      <section className="bg-surface text-fg rounded-3xl p-4 shadow-xl">
        <div className="text-center mb-3">
          <div className="text-6xl">{gender === 'female' ? '👶🏻' : '👶🏽'}</div>
          <div className="font-extrabold text-xl mt-1">{firstName} {lastName}</div>
          <div className="text-sm opacity-70">{FLAGS[country]} {c.cities[0]}, {c.name}</div>
        </div>

        <label className="block text-xs uppercase tracking-widest opacity-60 mb-1">{t('setup.firstName')}</label>
        <input value={first} onChange={(e) => setFirst(e.target.value)} placeholder={suggestion.first} maxLength={20}
          className="w-full rounded-2xl bg-card px-4 py-3 mb-3 shadow-sm outline-none focus:ring-2 ring-accent" />
        <label className="block text-xs uppercase tracking-widest opacity-60 mb-1">{t('setup.lastName')}</label>
        <input value={last} onChange={(e) => setLast(e.target.value)} placeholder={suggestion.last} maxLength={20}
          className="w-full rounded-2xl bg-card px-4 py-3 mb-3 shadow-sm outline-none focus:ring-2 ring-accent" />

        <label className="block text-xs uppercase tracking-widest opacity-60 mb-1">{t('setup.gender')}</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['female', 'male'] as const).map((g) => (
            <button key={g} onClick={() => setGender(g)}
              className={`rounded-2xl py-3 font-semibold transition ${gender === g ? 'bg-accent text-on-accent' : 'bg-card'}`}>
              {g === 'female' ? '👧 ' : '👦 '}{t(`setup.${g}`)}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-widest opacity-60 mb-1">{t('setup.country')}</label>
        <div className="grid grid-cols-4 gap-1.5 mb-1">
          {NAMES.countries.map((x) => (
            <button key={x.code} onClick={() => setCountry(x.code)} title={x.name}
              className={`rounded-xl py-2 text-2xl leading-none transition ${country === x.code ? 'bg-accent ring-2 ring-accent' : 'bg-card'}`}>
              {FLAGS[x.code] ?? '🏳️'}
            </button>
          ))}
        </div>
        <div className="text-center text-sm opacity-70 mb-1">{c.name}</div>
      </section>

      <div className="flex flex-col gap-2 py-4">
        <button onClick={() => newLife({ firstName, lastName, gender, countryCode: country, seed })}
          className="rounded-2xl bg-accent text-on-accent font-bold text-lg py-4 active:scale-95 transition anim-pop">
          {t('setup.start')}
        </button>
        <button onClick={() => { setSeed(newSeed()); setFirst(''); setLast('') }} className="rounded-2xl bg-chrome-soft font-semibold py-3 active:scale-95 transition">
          🎲 {t('setup.random')}
        </button>
      </div>
    </main>
  )
}
