import type { DiaryEntry, Life } from './types'

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

export function log(life: Life, kind: DiaryEntry['kind'], text: string, params?: DiaryEntry['params']) {
  life.diary.push({ age: life.age, kind, text, params })
}

let counter = 0
export function uid(prefix = 'p') {
  return `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`
}

export function kill(life: Life, cause: string) {
  if (!life.alive) return
  life.alive = false
  life.causeOfDeath = cause
  life.diary.push({ age: life.age, kind: 'death', text: cause })
}
