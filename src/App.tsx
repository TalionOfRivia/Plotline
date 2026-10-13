import { useTranslation } from 'react-i18next'
import { LANGS } from './i18n'

export default function App() {
  const { t, i18n } = useTranslation()
  return (
    <main className="h-full flex flex-col items-center justify-center gap-8 px-6 safe-top safe-bottom">
      <div className="text-center">
        <div className="text-7xl mb-4">📖</div>
        <h1 className="text-5xl font-extrabold tracking-tight">{t('app.name')}</h1>
        <p className="mt-2 text-lg opacity-80">{t('app.tagline')}</p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <button className="rounded-2xl bg-accent text-ink font-bold text-lg py-4 active:scale-95 transition">
          {t('menu.newLife')}
        </button>
        <button className="rounded-2xl bg-ink-soft font-semibold py-3 opacity-60" disabled>
          {t('menu.continue')}
        </button>
      </div>

      <div className="flex gap-2 text-sm">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => i18n.changeLanguage(l)}
            className={`px-3 py-1 rounded-full ${i18n.language === l ? 'bg-cream text-ink' : 'bg-ink-soft'}`}
          >
            {l === 'en' ? 'English' : 'עברית'}
          </button>
        ))}
      </div>
    </main>
  )
}
