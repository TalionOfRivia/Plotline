import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Row, Section, Sheet } from './Sheet'
import { LANGS } from '../i18n'
import type { Theme } from './theme'
import type { Life } from '../engine/types'
import { formatMoney } from './money'

export function MenuSheet() {
  const { t, i18n } = useTranslation()
  const g = useGame()
  const life = g.life!
  const [confirmNew, setConfirmNew] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(life)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `plotline-${life.firstName}-${life.age}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importSave = async (f: File | undefined) => {
    if (!f) return
    try {
      const data = JSON.parse(await f.text()) as Life
      if (!data?.seed || !data?.stats) throw new Error('bad')
      g.importLife(data)
      g.openSheet(null)
    } catch { g.setToast({ key: 'menu.importFailed', kind: 'bad' }) }
  }

  return (
    <Sheet title={t('menu.title')} emoji="☰">
      <Section title={t('menu.language')}>
        <div className="flex gap-2 mb-2">
          {LANGS.map((l) => (
            <button key={l} onClick={() => i18n.changeLanguage(l)} className={`px-4 py-2 rounded-full text-sm ${i18n.language === l ? 'bg-chrome text-chrome-fg' : 'bg-card'}`}>{l === 'en' ? 'English' : 'עברית'}</button>
          ))}
        </div>
      </Section>
      <Section title={t('menu.theme')}>
        <div className="flex gap-2 mb-2">
          {(['system', 'light', 'dark'] as Theme[]).map((th) => (
            <button key={th} onClick={() => g.setTheme(th)} className={`px-4 py-2 rounded-full text-sm ${g.theme === th ? 'bg-chrome text-chrome-fg' : 'bg-card'}`}>{t(`menu.themes.${th}`)}</button>
          ))}
        </div>
      </Section>
      <Section title={t('menu.tools')}>
        <Row emoji="🏆" title={t('challenge.title')} sub={t('challenge.menuSub', { done: g.completedChallenges.length })} onClick={() => g.openSheet('challenges')} />
        <div className="bg-card rounded-2xl p-3 mb-2 shadow-sm">
          <div className="font-semibold">⏪ {t('menu.undo')}</div>
          <div className="text-xs opacity-70 mb-2">{t('menu.undoSub')}</div>
          <div className="flex gap-1">{[1, 2, 3, 5].map((n) => { const avail = (g.undo ? 1 : 0) + g.history.length; return <button key={n} disabled={n > avail} onClick={() => { g.undoYear(n); g.openSheet(null) }} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-fg/5 disabled:opacity-30">{t('menu.yearsBack', { n })}</button> })}</div>
        </div>
        <Row emoji="⚡" title={t('menu.godMode')} sub={g.godMode ? t('menu.on') : t('menu.off')} onClick={() => g.setGodMode(!g.godMode)} />
        {g.godMode && <GodPanel />}
      </Section>
      <Section title={t('menu.cemetery')}>
        {g.cemetery.length === 0 && <p className="text-xs opacity-60 px-1">{t('menu.cemeteryEmpty')}</p>}
        {g.cemetery.slice(0, 12).map((c, i) => (
          <Row key={i} emoji="🪦" title={c.name} sub={`${t('death.lived', { years: c.age })} · ${t('menu.generation', { n: c.generation })}${c.ribbon ? ` · ${c.ribbon}` : ''}`} right={formatMoney(c.worth, i18n.language)} />
        ))}
      </Section>
      <Section title={t('menu.customPeople')}>
        <p className="text-xs opacity-70 px-1 mb-2">{t('menu.customPeopleSub')}</p>
        {g.customPeople.map((p, i) => (
          <Row key={i} emoji={p.kind === 'friend' ? '🙂' : '💘'} title={`${p.first} ${p.last}`} sub={t(`menu.customKind.${p.kind}`)} right="✕" onClick={() => g.removeCustomPerson(i)} />
        ))}
        <CustomPersonForm />
      </Section>
      <Section title={t('menu.save')}>
        <Row emoji="📤" title={t('menu.export')} sub={t('menu.exportSub')} onClick={exportSave} />
        <Row emoji="📥" title={t('menu.import')} onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => importSave(e.target.files?.[0])} />
      </Section>
      <Section title={t('menu.life')}>
        <div className="bg-card rounded-2xl p-3 mb-2 text-xs opacity-70">{t('menu.generation', { n: life.generation })} · {t('menu.seed')}: {life.seed}</div>
        {!confirmNew ? (
          <Row emoji="🔄" title={t('menu.newLife')} sub={t('menu.newLifeSub')} onClick={() => setConfirmNew(true)} />
        ) : (
          <Row emoji="⚠️" title={t('menu.confirmNew')} onClick={() => g.newLife()} />
        )}
        <Row emoji="🏠" title={t('menu.toTitle')} onClick={g.toTitle} />
      </Section>
      <p className="text-center text-xs opacity-40 mt-6">Plotline · {t('app.tagline')}</p>
    </Sheet>
  )
}

function GodPanel() {
  const { t } = useTranslation()
  const life = useGame((s) => s.life)!
  const godEdit = useGame((s) => s.godEdit)
  const stat = (k: keyof Life['stats']) => (
    <label key={k} className="flex items-center gap-2 text-sm mb-1">
      <span className="w-24">{t(`stats.${k}`)}</span>
      <input type="range" min={0} max={100} value={life.stats[k]} onChange={(e) => godEdit({ stats: { [k]: Number(e.target.value) } })} className="flex-1" />
      <span className="w-8 text-end tabular-nums">{life.stats[k]}</span>
    </label>
  )
  return (
    <div className="bg-card rounded-2xl p-3 mb-2 shadow-sm">
      {(['happiness', 'health', 'smarts', 'looks'] as const).map(stat)}
      <label className="flex items-center gap-2 text-sm mb-1"><span className="w-24">{t('death.karma')}</span>
        <input type="range" min={-100} max={100} value={life.karma} onChange={(e) => godEdit({ karma: Number(e.target.value) })} className="flex-1" /><span className="w-8 text-end tabular-nums">{life.karma}</span></label>
      <label className="flex items-center gap-2 text-sm mb-1"><span className="w-24">{t('fame.level')}</span>
        <input type="range" min={0} max={100} value={life.fame} onChange={(e) => godEdit({ fame: Number(e.target.value) })} className="flex-1" /><span className="w-8 text-end tabular-nums">{Math.round(life.fame)}</span></label>
      <label className="flex items-center gap-2 text-sm"><span className="w-24">{t('assets.cash')}</span>
        <input type="number" value={Math.round(life.money)} onChange={(e) => godEdit({ money: Number(e.target.value) || 0 })} className="flex-1 rounded-xl bg-surface px-2 py-1" /></label>
    </div>
  )
}

function CustomPersonForm() {
  const { t } = useTranslation()
  const add = useGame((s) => s.addCustomPerson)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [gender, setGender] = useState<'female' | 'male'>('female')
  const [kind, setKind] = useState<'friend' | 'partner'>('friend')
  return (
    <div className="bg-card rounded-2xl p-3 shadow-sm flex flex-col gap-2">
      <div className="flex gap-2">
        <input value={first} onChange={(e) => setFirst(e.target.value)} placeholder={t('setup.firstName')} className="flex-1 min-w-0 rounded-xl bg-surface px-3 py-2 outline-none" />
        <input value={last} onChange={(e) => setLast(e.target.value)} placeholder={t('setup.lastName')} className="flex-1 min-w-0 rounded-xl bg-surface px-3 py-2 outline-none" />
      </div>
      <div className="flex gap-1 text-sm">
        {(['female', 'male'] as const).map((g) => <button key={g} onClick={() => setGender(g)} className={`flex-1 py-1.5 rounded-xl ${gender === g ? 'bg-chrome text-chrome-fg' : 'bg-fg/5'}`}>{t(`setup.${g}`)}</button>)}
        {(['friend', 'partner'] as const).map((k) => <button key={k} onClick={() => setKind(k)} className={`flex-1 py-1.5 rounded-xl ${kind === k ? 'bg-chrome text-chrome-fg' : 'bg-fg/5'}`}>{t(`menu.customKind.${k}`)}</button>)}
      </div>
      <button disabled={!first.trim()} onClick={() => { add({ first: first.trim(), last: last.trim(), gender, kind }); setFirst(''); setLast('') }} className="rounded-xl bg-accent text-on-accent font-bold py-2 disabled:opacity-40">{t('menu.addPerson')}</button>
    </div>
  )
}
