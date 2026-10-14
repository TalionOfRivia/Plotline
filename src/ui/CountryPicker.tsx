import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COUNTRIES, countryName } from '../engine/people'

/** Searchable country list, shared by character creation and emigration. */
export function CountryPicker({ value, onPick }: { value: string; onPick: (code: string) => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [query, setQuery] = useState('')
  const sorted = useMemo(() => COUNTRIES.map((x) => ({ code: x.code, flag: x.flag, label: countryName(x.code, lang), en: x.name }))
    .sort((a, b) => a.label.localeCompare(b.label, lang)), [lang])
  const q = query.trim().toLowerCase()
  const filtered = q ? sorted.filter((x) => x.label.toLowerCase().includes(q) || x.en.toLowerCase().includes(q) || x.code.toLowerCase() === q) : sorted
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('setup.searchCountry')}
        className="w-full rounded-2xl bg-card px-4 py-2 mb-2 outline-none focus:ring-2 ring-accent" />
      {filtered.map((x) => (
        <button key={x.code} onClick={() => onPick(x.code)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start ${x.code === value ? 'bg-accent text-on-accent' : 'active:bg-card'}`}>
          <span className="text-2xl w-8 text-center">{x.flag}</span>
          <span className="flex-1 font-semibold">{x.label}</span>
          {x.code === value && <span>✓</span>}
        </button>
      ))}
      {filtered.length === 0 && <p className="text-center opacity-60 py-6 text-sm">{t('setup.noMatch')}</p>}
    </div>
  )
}
