import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Row, Section, Sheet } from './Sheet'
import { LANGS } from '../i18n'
import type { Life } from '../engine/types'

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
            <button key={l} onClick={() => i18n.changeLanguage(l)} className={`px-4 py-2 rounded-full text-sm ${i18n.language === l ? 'bg-ink text-cream' : 'bg-paper'}`}>{l === 'en' ? 'English' : 'עברית'}</button>
          ))}
        </div>
      </Section>
      <Section title={t('menu.tools')}>
        <Row emoji="⏪" title={t('menu.undo')} sub={t('menu.undoSub')} disabled={!g.undo} onClick={() => { g.undoYear(); g.openSheet(null) }} />
        <Row emoji="⚡" title={t('menu.godMode')} sub={g.godMode ? t('menu.on') : t('menu.off')} onClick={() => g.setGodMode(!g.godMode)} />
        {g.godMode && <GodPanel />}
      </Section>
      <Section title={t('menu.save')}>
        <Row emoji="📤" title={t('menu.export')} sub={t('menu.exportSub')} onClick={exportSave} />
        <Row emoji="📥" title={t('menu.import')} onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => importSave(e.target.files?.[0])} />
      </Section>
      <Section title={t('menu.life')}>
        <div className="bg-paper rounded-2xl p-3 mb-2 text-xs opacity-70">{t('menu.generation', { n: life.generation })} · {t('menu.seed')}: {life.seed}</div>
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
    <div className="bg-paper rounded-2xl p-3 mb-2 shadow-sm">
      {(['happiness', 'health', 'smarts', 'looks'] as const).map(stat)}
      <label className="flex items-center gap-2 text-sm mb-1"><span className="w-24">{t('death.karma')}</span>
        <input type="range" min={-100} max={100} value={life.karma} onChange={(e) => godEdit({ karma: Number(e.target.value) })} className="flex-1" /><span className="w-8 text-end tabular-nums">{life.karma}</span></label>
      <label className="flex items-center gap-2 text-sm mb-1"><span className="w-24">{t('fame.level')}</span>
        <input type="range" min={0} max={100} value={life.fame} onChange={(e) => godEdit({ fame: Number(e.target.value) })} className="flex-1" /><span className="w-8 text-end tabular-nums">{Math.round(life.fame)}</span></label>
      <label className="flex items-center gap-2 text-sm"><span className="w-24">{t('assets.cash')}</span>
        <input type="number" value={Math.round(life.money)} onChange={(e) => godEdit({ money: Number(e.target.value) || 0 })} className="flex-1 rounded-xl bg-cream px-2 py-1" /></label>
    </div>
  )
}
