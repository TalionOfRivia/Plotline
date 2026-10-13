# Plotline — Project Plan

> **Status (2026-10-13):** Phases 0–6 built. Live at https://talionofrivia.github.io/Plotline/.
> Remaining: Phase 7 (phone handoff & on-device checks) and whatever corrections come from play-testing.

An original, ad-free, fully-unlocked text life simulator in the BitLife genre, built as a PWA
for iPhone (Safari → Add to Home Screen). English + Hebrew, hosted free on GitHub Pages.

Genre reference: `research/bitlife-genre-reference.md` (public sources only; no copied text/art).

## Ground rules
- Original name, writing, and look. Mechanics are genre conventions; content is ours.
- Zero paid-credit art. Emoji + CSS. If an icon/splash needs an image, PhotoCraft first;
  Higgsfield only with explicit permission.
- Every feature unlocked from the start. No ads, no paywall, no analytics, no network calls
  after first load (works offline).
- Preview on PC first; phone handoff at the end.

## Stack
| Layer | Choice | Why |
|---|---|---|
| App | Vite + React + TypeScript | Fast dev, tiny bundle, easy PWA plugin |
| State | Zustand + Immer | Simple store for one big "life" object |
| Styling | Tailwind CSS | Quick flat mobile UI; RTL via `dir="rtl"` + logical props |
| i18n | i18next + react-i18next | EN/HE toggle, pluralization, interpolation |
| Content | JSON "packs" (events, jobs, crimes, names…) | Data-driven; add content without touching code |
| RNG | seedrandom | Reproducible lives for testing |
| Save | localStorage (+ export/import save file) | Safari keeps storage for home-screen apps; export is the safety net |
| PWA | vite-plugin-pwa (Workbox) | Offline, installable, iOS meta tags |
| Hosting | GitHub Pages via GitHub Actions | Free, push-to-deploy |
| Tests | Vitest | Simulation engine (age-up, odds, money) is pure functions → unit-testable |

## Architecture
```
src/
  engine/        pure game logic, no React: ageUp(), events, jobs, crime, relationships, death
  content/       JSON packs: events.en.json / events.he.json, jobs, crimes, names, ribbons…
  state/         Zustand store, save/load, migrations
  ui/            screens + components (Top bar, Diary, Stat bars, Bottom nav, Modals)
  i18n/          locale files, RTL helper
```
Event format (illustrative):
```json
{ "id": "found_wallet", "minAge": 8, "maxAge": 90, "weight": 3,
  "text": "You found a wallet on the street with $200 inside.",
  "choices": [
    { "text": "Return it", "effects": { "happiness": +10, "karma": +5 } },
    { "text": "Keep the cash", "effects": { "money": +200, "karma": -5 } } ] }
```

## Phases (each ends with a working build you can click through)

**Phase 0 — Scaffold & pipeline** (½ day)
Repo, Vite+React+TS+Tailwind, PWA manifest, GitHub Actions → Pages. "Hello life" deployed to a URL.

**Phase 1 — Core loop** (1 day)
New life (random name/country/gender/parents), Age button, diary, 4 stat bars (Happiness/Health/
Smarts/Looks) + hidden karma, yearly random events with choices, death + tombstone, save/load.
~60 childhood/teen events to start.

**Phase 2 — School, careers, money** (1–2 days)
Grades, school activities, part-time jobs, driving test; university majors, loans/scholarships;
grad schools (law/med/business); job board, interviews, performance meter, promotions, firing,
taxes; assets: houses (mortgage, condition), cars, pets; lottery; retirement/pension.

**Phase 3 — Relationships & family** (1 day)
Relationship bars with interactions (spend time, gift, compliment, argue, ask for money);
dating/apps, marriage (prenup when rich), divorce splitting assets, kids, affairs via events,
siblings/friends with real depth (a known complaint about the genre), inheritance.

**Phase 4 — Crime, prison, dark paths** (1 day)
Age-gated crimes (shoplifting → burglary minigame → GTA → bank robbery → hitman), arrest flow
(lawyer choice, plea), prison tab (gangs, appeals, riots), grid-maze escape minigame, fugitive status.
Odds visible on screen (another genre complaint — ours are transparent).

**Phase 5 — Special paths (the "premium" content, all free)** (2 days)
Fame (social media, book deals, commercials), Royalty (born into a monarchy, laws, execution…),
Mafia (join family, rank up, extortion/heists, whacking), Business (found & run a company),
Pro Sports, Astronaut, Secret Agent, Teacher, Landlord/Investor (rentals, stocks).
Plus the "God Mode" & "Time Machine" equivalents: edit stats freely, undo last year.

**Phase 6 — Polish, Hebrew, legacy** (1–2 days)
Full Hebrew translation + RTL layout pass; ribbons at death (~30); achievements; legacy
(continue as heir); dark mode; haptics-feel animations; app icon + splash (CSS/emoji → PhotoCraft
if needed); save export/import.

**Phase 7 — Phone handoff** (½ day)
Final deploy, iPhone install walkthrough (Safari → Share → Add to Home Screen), check offline,
check storage persists, check RTL on device.

Total: roughly 8–10 working days of my time, with you clicking a live build after every phase.

## Delegation (multiple agents, cheaper models where they fit)
| Work | Who |
|---|---|
| Engine design, data model, UI, PWA/deploy, review of everything merged | Me (Fable) |
| Writing event packs in bulk (hundreds of events per life stage, deadpan tone) | Sonnet agents, one per life stage, writing to separate JSON files |
| Hebrew translation of content + UI strings | Sonnet agent, after English is frozen per phase |
| Name lists, ribbon/achievement tables, job/salary tables, crime odds tables | Haiku agents |
| Unit tests for pure engine functions | Sonnet agent |
Rule: agents never touch the same file; I review and integrate each pack before it ships.

## Name proposals (original; checking App Store collisions before committing)
1. **Plotline** — "every life is a story"
2. **Lifetimes**
3. **Tiny Lives**
4. **Ever After**

## Open items for you
- Pick a name (→ folder `D:\<name>`, repo `<name>`).
- GitHub repo: create it on github.com, or let me install the `gh` CLI (winget) so I can.
- Anything specific she loves or hates in BitLife that I should prioritize or avoid?
