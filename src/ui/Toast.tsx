import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'

export function Toast() {
  const { t } = useTranslation()
  const toast = useGame((s) => s.toast)
  const setToast = useGame((s) => s.setToast)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast, setToast])
  if (!toast) return null
  const tone = toast.kind === 'good' ? 'bg-emerald-600' : toast.kind === 'bad' ? 'bg-red-600' : 'bg-ink-soft'
  return (
    <div className="fixed left-0 right-0 top-0 z-30 flex justify-center pointer-events-none safe-top">
      <div className={`mt-3 mx-4 px-4 py-2 rounded-2xl text-cream shadow-xl text-sm font-semibold ${tone}`}>
        {t(toast.key, toast.params)}
      </div>
    </div>
  )
}
