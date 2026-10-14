import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const KEY = 'plotline.tutorial.v1'

/** Three one-time tips over the first life. */
export function Tutorial() {
  const { t } = useTranslation()
  const [step, setStep] = useState(() => { try { return localStorage.getItem(KEY) ? 3 : 0 } catch { return 3 } })
  if (step >= 3) return null
  const next = () => { const n = step + 1; setStep(n); if (n >= 3) { try { localStorage.setItem(KEY, '1') } catch { /* ignore */ } } }
  return (
    <div className="fixed inset-0 z-30 bg-black/55 flex items-end justify-center p-4 anim-fade" onClick={next}>
      <div className="bg-surface text-fg rounded-3xl p-5 w-full max-w-md shadow-2xl anim-rise mb-28">
        <div className="text-3xl mb-1">{['📊', '➕', '🎯'][step]}</div>
        <p className="font-semibold">{t(`tutorial.${step}`)}</p>
        <p className="text-xs opacity-60 mt-2">{t('tutorial.tap')}</p>
      </div>
    </div>
  )
}
