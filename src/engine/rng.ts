import seedrandom from 'seedrandom'

/** Deterministic RNG. `calls` lets a save resume the exact sequence. */
export class Rng {
  private prng: seedrandom.PRNG
  calls = 0

  constructor(seed: string, skip = 0) {
    this.prng = seedrandom(seed)
    for (let i = 0; i < skip; i++) this.prng()
    this.calls = skip
  }

  /** [0, 1) */
  float(): number {
    this.calls++
    return this.prng()
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return min + Math.floor(this.float() * (max - min + 1))
  }

  chance(p: number): boolean {
    return this.float() < p
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]
  }

  weighted<T>(items: readonly T[], weightOf: (t: T) => number): T | undefined {
    const total = items.reduce((s, it) => s + Math.max(0, weightOf(it)), 0)
    if (total <= 0) return undefined
    let r = this.float() * total
    for (const it of items) {
      r -= Math.max(0, weightOf(it))
      if (r < 0) return it
    }
    return items[items.length - 1]
  }

  /** normal-ish value via 3 uniforms, clamped */
  bell(min: number, max: number): number {
    const u = (this.float() + this.float() + this.float()) / 3
    return Math.round(min + u * (max - min))
  }
}

export function newSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
