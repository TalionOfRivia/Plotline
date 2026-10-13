import { describe, expect, it } from 'vitest'
import { EVENT_TEXT } from './content'
import { SYS_TEXT } from './systems'
import en from '../i18n/en.json'
import he from '../i18n/he.json'

function keys(o: unknown, prefix = ''): string[] {
  if (o && typeof o === 'object') return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
  return [prefix]
}
const diff = (a: unknown, b: unknown) => keys(a).filter((k) => !new Set(keys(b)).has(k))

describe('Hebrew coverage', () => {
  it('UI strings match English keys', () => {
    expect(diff(en, he)).toEqual([])
    expect(diff(he, en)).toEqual([])
  })
  it('system text packs exist in Hebrew with the same keys', () => {
    for (const pack of Object.keys(SYS_TEXT.en)) {
      expect(SYS_TEXT.he?.[pack], `missing he/sys_${pack}.json`).toBeTruthy()
      expect(diff(SYS_TEXT.en[pack], SYS_TEXT.he[pack]), pack).toEqual([])
    }
  })
  it('every event has Hebrew text, choices and outcomes', () => {
    const missing = Object.keys(EVENT_TEXT.en).filter((id) => diff(EVENT_TEXT.en[id], EVENT_TEXT.he?.[id]).length > 0)
    expect(missing).toEqual([])
  })
  it('placeholders are preserved in Hebrew', () => {
    const ph = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort().join(',')
    const bad: string[] = []
    const walk = (a: unknown, b: unknown, path: string) => {
      if (typeof a === 'string') { if (typeof b === 'string' && ph(a) !== ph(b)) bad.push(path); return }
      if (a && typeof a === 'object') for (const k of Object.keys(a)) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown> | undefined)?.[k], `${path}.${k}`)
    }
    walk(en, he, 'ui')
    walk(EVENT_TEXT.en, EVENT_TEXT.he, 'events')
    expect(bad).toEqual([])
  })
})
