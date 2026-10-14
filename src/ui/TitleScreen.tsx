import { useTranslation } from 'react-i18next'
import { LANGS } from '../i18n'
import { useGame } from '../state/store'

/** Shown in mobile Safari when the app isn't installed yet. */
function InstallHint() {
  const { t } = useTranslation()
  const nav = navigator as Navigator & { standalone?: boolean }
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const standalone = nav.standalone || window.matchMedia('(display-mode: standalone)').matches
  if (!isIOS || standalone) return null
  return (
    <div className="max-w-xs text-center text-xs bg-chrome-soft rounded-2xl px-4 py-3 opacity-90">
      {t('menu.installHint')}
    </div>
  )
}

export function TitleScreen() {
  const { t, i18n } = useTranslation()
  const toSetup = useGame((s) => s.toSetup)
  const life = useGame((s) => s.life)
  const resume = useGame((s) => s.resume)
  const canContinue = Boolean(life)

  return (
    <main className="h-full flex flex-col items-center justify-center gap-8 px-6 safe-top safe-bottom anim-fade">
      <div className="text-center">
        <div className="text-7xl mb-4">📖</div>
        <h1 className="text-5xl font-extrabold tracking-tight">{t('app.name')}</h1>
        <p className="mt-2 text-lg opacity-80">{t('app.tagline')}</p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={toSetup}
          className="rounded-2xl bg-accent text-on-accent font-bold text-lg py-4 active:scale-95 transition"
        >
          {t('menu.newLife')}
        </button>
        <button
          onClick={resume}
          disabled={!canContinue}
          className="rounded-2xl bg-chrome-soft font-semibold py-3 disabled:opacity-40 active:scale-95 transition"
        >
          {canContinue && life
            ? t('menu.continueAs', { name: life.firstName, age: life.age })
            : t('menu.continue')}
        </button>
      </div>

      <InstallHint />

      <div className="flex gap-2 text-sm">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => i18n.changeLanguage(l)}
            className={`px-3 py-1 rounded-full ${i18n.language === l ? 'bg-surface text-fg' : 'bg-chrome-soft'}`}
          >
            {l === 'en' ? 'English' : 'עברית'}
          </button>
        ))}
      </div>
    </main>
  )
}
