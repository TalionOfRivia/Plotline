import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { COUNTRIES, COUNTRY_BY_CODE, countryName, randomName } from '../engine/people'
import { Rng, newSeed } from '../engine/rng'
import type { Gender } from '../engine/types'
import { WorldMap } from './WorldMap'

const randomCountry = () => COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].code

/** Character creation: name, gender, country. Everything can be re-rolled. */
export function NewLifeScreen() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const newLife = useGame((s) => s.newLife)
  const toTitle = useGame((s) => s.toTitle)
  const [gender, setGender] = useState<Gender>(() => (Math.random() < 0.5 ? 'female' : 'male'))
  const [country, setCountry] = useState(randomCountry)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [seed, setSeed] = useState(newSeed)
  const [city, setCity] = useState('')
  const [query, setQuery] = useState('')
  const [picking, setPicking] = useState(false)

  // a suggestion that follows the chosen country/gender until the player types
  const suggestion = useMemo(() => randomName(new Rng(seed + country + gender), country, gender), [seed, country, gender])
  const firstName = first.trim() || suggestion.first
  const lastName = last.trim() || suggestion.last
  const c = COUNTRY_BY_CODE[country]

  const sorted = useMemo(() => {
    const list = COUNTRIES.map((x) => ({ code: x.code, flag: x.flag, label: countryName(x.code, lang), en: x.name }))
    return list.sort((a, b) => a.label.localeCompare(b.label, lang))
  }, [lang])
  const q = query.trim().toLowerCase()
  const filtered = q ? sorted.filter((x) => x.label.toLowerCase().includes(q) || x.en.toLowerCase().includes(q) || x.code.toLowerCase() === q) : sorted

  if (picking) {
    return (
      <main className="h-full flex flex-col safe-top safe-bottom anim-rise">
        <header className="flex items-center gap-2 px-3 py-3">
          <button onClick={() => setPicking(false)} className="text-2xl px-2 active:opacity-60 rtl:-scale-x-100">‹</button>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('setup.searchCountry')}
            className="flex-1 rounded-2xl bg-chrome-soft px-4 py-2 outline-none focus:ring-2 ring-accent" />
        </header>
        <div className="flex-1 overflow-y-auto px-3">
          {filtered.map((x) => (
            <button key={x.code} onClick={() => { setCountry(x.code); setPicking(false); setQuery('') }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start ${x.code === country ? 'bg-accent text-on-accent' : 'active:bg-chrome-soft'}`}>
              <span className="text-2xl w-8 text-center">{x.flag}</span>
              <span className="flex-1 font-semibold">{x.label}</span>
              {x.code === country && <span>✓</span>}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center opacity-60 py-6 text-sm">{t('setup.noMatch')}</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="h-full overflow-y-auto flex flex-col px-5 safe-top safe-bottom anim-fade">
      <header className="flex items-center gap-2 py-3">
        <button onClick={toTitle} className="text-2xl px-2 active:opacity-60 rtl:-scale-x-100">‹</button>
        <h1 className="font-extrabold text-xl flex-1">{t('setup.title')}</h1>
      </header>

      <section className="bg-surface text-fg rounded-3xl p-4 shadow-xl">
        <div className="text-center mb-3">
          <div className="text-6xl">{gender === 'female' ? '👶🏻' : '👶🏽'}</div>
          <div className="font-extrabold text-xl mt-1">{firstName} {lastName}</div>
          <div className="text-sm opacity-70">{c.flag} {city.trim() || c.cities[0]}, {countryName(country, lang)}</div>
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
        <div className="mb-2"><WorldMap value={country} onChange={setCountry} label={(code) => countryName(code, lang)} /></div>
        <button onClick={() => setPicking(true)} className="w-full flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm text-start active:scale-[0.99] transition">
          <span className="text-2xl">{c.flag}</span>
          <span className="flex-1 font-semibold">{countryName(country, lang)}</span>
          <span className="opacity-50">›</span>
        </button>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('setup.cityPlaceholder', { city: c.cities[0] })} maxLength={30}
          className="w-full rounded-2xl bg-card px-4 py-3 mt-2 shadow-sm outline-none focus:ring-2 ring-accent" />
        <div className="text-center text-xs opacity-60 mt-2">{t('setup.countries', { n: COUNTRIES.length })}</div>
      </section>

      <div className="flex flex-col gap-2 py-4">
        <button onClick={() => newLife({ firstName, lastName, gender, countryCode: country, seed, city })}
          className="rounded-2xl bg-accent text-on-accent font-bold text-lg py-4 active:scale-95 transition anim-pop">
          {t('setup.start')}
        </button>
        <button onClick={() => { setSeed(newSeed()); setFirst(''); setLast(''); setCountry(randomCountry()); setGender(Math.random() < 0.5 ? 'female' : 'male') }}
          className="rounded-2xl bg-chrome-soft font-semibold py-3 active:scale-95 transition">
          🎲 {t('setup.random')}
        </button>
      </div>
    </main>
  )
}
