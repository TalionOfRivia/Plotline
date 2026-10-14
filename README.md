# Plotline 📖

*Every life is a story.* An original, ad-free text life simulator — grow from a newborn to old age, one year per tap, through random events, school, careers, money, relationships, crime, and a few wilder paths (fame, royalty, the family, business, space, espionage). Everything is unlocked. Nothing is tracked.

Built as a PWA: open it in Safari on an iPhone, **Share → Add to Home Screen**, and it runs like an app, offline.

**Play:** https://talionofrivia.github.io/Plotline/

## Features
- English / עברית toggle with full RTL layout
- ~650 original events with 2–4 choices; risky choices show their real odds up front
- School → university (16 majors) → 7 graduate schools; scholarships and loans
- 42 career tracks with ladders, interviews, performance, promotions, firings, retirement and pensions
- Homes (with mortgages), cars, pets, luxury; net worth tracking
- Relationships with real interactions, dating, marriage, prenups, kids, divorce, inheritance
- 12 crimes with transparent odds; prison with gangs, parole, riots and escapes
- Fame, royalty, mafia, business, pro sports, astronaut and secret-agent paths
- 36 challenges with progress tracking across lives
- Light / dark / auto theme
- Ribbons at death, legacy mode (continue as your child), time machine (undo a year), god mode, save export/import

## Development
```bash
npm install
npm run dev      # http://localhost:5173/Plotline/
npm test         # engine + content integrity + 40-life simulation
npm run build    # production build in dist/
```
Pushes to `main` deploy to GitHub Pages via Actions.

### Content
All game content is data under `src/content/` — see `schema.md` (events) and `schema-systems.md` (jobs, assets, crimes…). Logic and text live in separate files so translations never touch numbers.

## Credits
Made with love for one specific player. Mechanics are genre conventions; all writing, art and code are original.
