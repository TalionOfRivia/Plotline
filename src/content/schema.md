# Content pack format

Game content is data. Each pack is a pair of files:

- `events/<pack>.json` — the **logic**: ids, conditions, weights, choices, effects. Language-neutral.
- `text/en/<pack>.json`, `text/he/<pack>.json` — the **words** for that pack, keyed by event id.

Keep logic and text in separate files so translators never touch numbers.

## Logic file (`events/<pack>.json`)

```json
[
  {
    "id": "found_wallet",
    "category": "random",
    "weight": 3,
    "once": true,
    "conditions": { "minAge": 8, "maxAge": 90 },
    "choices": [
      { "id": "return", "effects": { "happiness": 8, "karma": 6 } },
      { "id": "keep",   "effects": { "money": 200, "karma": -6 } },
      {
        "id": "look_for_owner",
        "showOdds": true,
        "outcomes": [
          { "id": "found",  "weight": 60, "effects": { "happiness": 12, "karma": 8, "money": 50 } },
          { "id": "nobody", "weight": 40, "effects": { "money": 200 } }
        ]
      }
    ]
  }
]
```

Field reference (see `src/engine/types.ts` for the exact TypeScript):

| Field | Meaning |
|---|---|
| `id` | unique, `snake_case`, stable forever (saves reference it) |
| `category` | `childhood` `school` `family` `social` `health` `money` `work` `romance` `crime` `random` `death` |
| `weight` | relative pick probability among eligible events (default 1). 1 = rare, 3 = common, 6 = very common |
| `once` | default `true`: never repeats within one life. Set `false` for recurring flavor events |
| `conditions` | `minAge`, `maxAge`, `gender`, `flags`, `notFlags`, `minMoney`, `minStats`, `maxStats`, `requiresPerson` |
| `choices[].effects` | deltas: `happiness` `health` `smarts` `looks` (0..100 scale, typical ±5..±20), `karma` (±5..±15), `money` (absolute currency), `flags`, `relationship` (±5..±30 with the event's person), `death` (cause key) |
| `choices[].outcomes` | weighted random results instead of fixed effects; `showOdds: true` displays the % to the player |

Stat effect scale: ±3 trivial, ±8 noticeable, ±15 big, ±30 life-changing.
Money scale (USD-ish): kid pocket money 5–50, teen job 2,000–8,000/yr, adult salary 25,000–150,000/yr.

`requiresPerson` makes the event "about" a random living person of that kind; the text
can use `{{name}}` for them, and `relationship` effects apply to them.

## Text file (`text/<lang>/<pack>.json`)

```json
{
  "found_wallet": {
    "text": "You found a wallet on the sidewalk. There's $200 inside and an ID.",
    "choices": {
      "return": "Return it to the owner",
      "keep": "Keep the cash",
      "look_for_owner": "Look for the owner"
    },
    "outcomes": {
      "found": "The owner was so relieved she gave you $50 and a hug.",
      "nobody": "Nobody claimed it. Finders keepers."
    }
  }
}
```

Available placeholders: `{{name}}` (the event's person), `{{firstName}}` (the player), `{{money}}`.

## Tone guide

Second person, present tense, deadpan. Short sentences. Dark humour is fine, cruelty is not.
Never reference real brands, people, or the game this is inspired by. No slurs, no sexual content
involving minors, no self-harm instructions. Consequences should feel fair: bad choices can pay off
sometimes, good choices can backfire sometimes, but karma leans the odds over a life.
