# System data tables

Besides random events (see `schema.md`), the game has data-driven *systems*. Each is one JSON
file under `src/content/systems/` plus text under `src/content/text/<lang>/sys_<name>.json`.
All ids are stable `snake_case`. Money is USD-ish.

## jobs.json

```json
{
  "tracks": [
    {
      "id": "software",
      "emoji": "💻",
      "requires": { "education": "university", "majors": ["computer_science", "engineering", "math"], "minSmarts": 55 },
      "ladder": [
        { "id": "junior_dev", "salary": 62000, "minYears": 0 },
        { "id": "developer", "salary": 88000, "minYears": 2 },
        { "id": "senior_dev", "salary": 125000, "minYears": 5 },
        { "id": "staff_eng", "salary": 170000, "minYears": 9 },
        { "id": "cto", "salary": 260000, "minYears": 14 }
      ]
    }
  ]
}
```
- `requires.education`: `none` | `high_school` | `university` | `grad_law` | `grad_med` | `grad_business` | `grad_dental` | `grad_vet` | `grad_pharm` | `grad_nursing`
- `requires.majors` (optional list), `minSmarts`, `minLooks`, `minHealth` (optional, 0–100), `minAge` (default 18; part-time tracks 14)
- `ladder[]` top to bottom by seniority; `minYears` = years in the track before promotion is possible.
- Text file: `tracks.<id>.name`, `tracks.<id>.ladder.<rungId>` = job title.

## education.json

```json
{
  "majors": [ { "id": "computer_science", "emoji": "💻", "minSmarts": 55 } ],
  "gradSchools": [ { "id": "grad_law", "emoji": "⚖️", "years": 3, "cost": 120000, "requiresMajors": ["political_science","philosophy","english","history","business","any"], "minSmarts": 65 } ],
  "universityCost": 90000,
  "universityYears": 4,
  "scholarshipMinSmarts": 85
}
```

## assets.json

```json
{
  "houses": [ { "id": "studio_apartment", "emoji": "🏢", "price": 120000, "upkeep": 2400, "happiness": 2 } ],
  "cars":   [ { "id": "used_hatchback", "emoji": "🚗", "price": 6000, "upkeep": 900, "looks": 0, "happiness": 2 } ],
  "pets":   [ { "id": "dog", "emoji": "🐕", "price": 800, "upkeep": 1200, "happiness": 8, "lifespan": 13 } ],
  "luxury": [ { "id": "yacht", "emoji": "🛥️", "price": 2500000, "upkeep": 150000, "happiness": 10 } ]
}
```
- `upkeep` per year. Houses appreciate ~3%/yr, cars depreciate ~12%/yr.
- Text: `houses.<id>`, `cars.<id>`, `pets.<id>`, `luxury.<id>` = display names.

## crimes.json

```json
[
  { "id": "shoplift", "emoji": "🛍️", "minAge": 12, "baseSuccess": 0.7, "payout": [20, 200], "sentenceYears": [0, 1], "karma": -5 },
  { "id": "bank_robbery", "emoji": "🏦", "minAge": 18, "baseSuccess": 0.25, "payout": [50000, 400000], "sentenceYears": [6, 15], "karma": -25 }
]
```
- Success is modified by smarts (+), prior convictions (−), and random luck. Displayed to the player before committing.
- Text: `<id>.name`, `<id>.success` (flavour on success, may use `{{money}}`), `<id>.caught`.

## activities.json

Simple yearly actions with fixed costs/effects (gym, doctor, meditation, vacation, lottery ticket, casino…).
```json
[ { "id": "gym", "emoji": "🏋️", "cost": 600, "minAge": 14, "effects": { "health": 6, "looks": 3, "happiness": 2 } } ]
```
Text: `<id>.name`, `<id>.blurb`.

## ribbons.json

Awarded at death, first match wins (ordered by priority):
```json
[ { "id": "loaded", "emoji": "💎", "priority": 10, "when": { "minMoney": 50000000 } } ]
```
`when` fields: `minMoney`, `maxMoney`, `minAge`, `maxAge`, `minKids`, `minCrimes`, `minPrisonYears`, `flags`, `notFlags`, `maxEvents`, `minMarriages`, `famous`, `royal`.
Text: `<id>.name`, `<id>.blurb`.
