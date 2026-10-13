import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import he from './he.json'

export const LANGS = ['en', 'he'] as const
export type Lang = (typeof LANGS)[number]

const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('plotline.lang')) as Lang | null

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, he: { translation: he } },
  lng: saved && LANGS.includes(saved) ? saved : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function applyDir(lang: string) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
}

i18n.on('languageChanged', (lang) => {
  applyDir(lang)
  try { localStorage.setItem('plotline.lang', lang) } catch { /* private mode */ }
})
applyDir(i18n.language)

export default i18n
