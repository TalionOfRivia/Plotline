import type { EventTextPack, GameEvent } from './types'

// Vite bundles every pack under content/events and content/text at build time.
const eventModules = import.meta.glob<{ default: GameEvent[] }>('../content/events/*.json', { eager: true })
const textModules = import.meta.glob<{ default: EventTextPack }>('../content/text/*/*.json', { eager: true })

export const ALL_EVENTS: GameEvent[] = Object.values(eventModules).flatMap((m) => m.default)
export const EVENT_BY_ID: Record<string, GameEvent> = Object.fromEntries(ALL_EVENTS.map((e) => [e.id, e]))

/** text[lang][eventId] */
export const EVENT_TEXT: Record<string, EventTextPack> = {}
for (const [path, mod] of Object.entries(textModules)) {
  const lang = path.split('/').at(-2)!
  EVENT_TEXT[lang] = { ...(EVENT_TEXT[lang] ?? {}), ...mod.default }
}

export function eventText(lang: string, id: string) {
  return EVENT_TEXT[lang]?.[id] ?? EVENT_TEXT.en?.[id]
}
