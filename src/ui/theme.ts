export type Theme = 'system' | 'light' | 'dark'

const KEY = 'plotline.theme'
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')

export function loadTheme(): Theme {
  try { const v = localStorage.getItem(KEY) as Theme | null; if (v === 'light' || v === 'dark' || v === 'system') return v } catch { /* private mode */ }
  return 'system'
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && mq().matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#0d1420' : '#1b2a41')
  try { localStorage.setItem(KEY, theme) } catch { /* ignore */ }
}

export function initTheme() {
  applyTheme(loadTheme())
  mq().addEventListener('change', () => { if (loadTheme() === 'system') applyTheme('system') })
}
