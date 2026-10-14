import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

// ---------------------------------------------------------------------------
// Escape maze: you move one step, the guard moves two (horizontal first).
// Reach the exit without being caught. Trap the guard against a wall to win time.
// ---------------------------------------------------------------------------

type Cell = 0 | 1 // 0 floor, 1 wall
const W = 9, H = 9

function buildMaze(seed: number): Cell[][] {
  let s = seed
  const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
  const g: Cell[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => 0))
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rnd() < 0.22 && !(x === 0 && y === H - 1) && !(x === W - 1 && y === 0)) g[y][x] = 1
  // keep a guaranteed corridor
  for (let i = 0; i < W; i++) g[Math.floor(H / 2)][i] = 0
  for (let i = 0; i < H; i++) g[i][Math.floor(W / 2)] = 0
  return g
}

export function EscapeMaze({ seed, onDone }: { seed: number; onDone: (won: boolean) => void }) {
  const { t } = useTranslation()
  const grid = useMemo(() => buildMaze(seed), [seed])
  const [me, setMe] = useState({ x: 0, y: H - 1 })
  const [guard, setGuard] = useState({ x: W - 1, y: H - 1 })
  const [over, setOver] = useState<null | 'won' | 'caught'>(null)
  const exit = { x: W - 1, y: 0 }
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && grid[y][x] === 0

  const move = (dx: number, dy: number) => {
    if (over) return
    const nx = me.x + dx, ny = me.y + dy
    if (!free(nx, ny)) return
    const m = { x: nx, y: ny }
    if (m.x === exit.x && m.y === exit.y) { setMe(m); setOver('won'); setTimeout(() => onDone(true), 600); return }
    // guard: two steps, horizontal first, blocked by walls (that's the trick)
    let g = { ...guard }
    for (let step = 0; step < 2; step++) {
      const hx = Math.sign(m.x - g.x), vy = Math.sign(m.y - g.y)
      if (hx !== 0 && free(g.x + hx, g.y)) g = { x: g.x + hx, y: g.y }
      else if (vy !== 0 && free(g.x, g.y + vy)) g = { x: g.x, y: g.y + vy }
      if (g.x === m.x && g.y === m.y) { setMe(m); setGuard(g); setOver('caught'); setTimeout(() => onDone(false), 600); return }
    }
    setMe(m); setGuard(g)
  }

  return (
    <div className="fixed inset-0 z-40 bg-chrome text-chrome-fg flex flex-col items-center justify-center p-4 anim-fade">
      <h2 className="font-extrabold text-xl mb-1">{t('maze.title')}</h2>
      <p className="text-xs opacity-70 mb-3 text-center max-w-xs">{t('maze.hint')}</p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${W}, 30px)` }}>
        {grid.map((row, y) => row.map((c, x) => {
          const isMe = me.x === x && me.y === y, isG = guard.x === x && guard.y === y, isExit = exit.x === x && exit.y === y
          return <div key={`${x}-${y}`} className={`w-[30px] h-[30px] rounded-sm flex items-center justify-center text-lg ${c ? 'bg-chrome-soft' : 'bg-surface/20'}`}>{isMe ? '🧑' : isG ? '👮' : isExit ? '🚪' : ''}</div>
        }))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 w-44">
        <span /><button onClick={() => move(0, -1)} className="py-3 rounded-xl bg-chrome-soft text-xl">↑</button><span />
        <button onClick={() => move(-1, 0)} className="py-3 rounded-xl bg-chrome-soft text-xl">←</button>
        <button onClick={() => move(0, 1)} className="py-3 rounded-xl bg-chrome-soft text-xl">↓</button>
        <button onClick={() => move(1, 0)} className="py-3 rounded-xl bg-chrome-soft text-xl">→</button>
      </div>
      {over && <div className="mt-3 font-bold">{over === 'won' ? t('maze.won') : t('maze.caught')}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Minesweeper (deployment): clear the safe cells. 6x6 with 6 mines.
// ---------------------------------------------------------------------------
export function Minesweeper({ seed, onDone }: { seed: number; onDone: (cleared: number, total: number, hitMine: boolean) => void }) {
  const { t } = useTranslation()
  const N = 6, MINES = 6
  const mines = useMemo(() => {
    let s = seed; const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
    const set = new Set<number>(); while (set.size < MINES) set.add(Math.floor(rnd() * N * N)); return set
  }, [seed])
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [dead, setDead] = useState(false)
  const total = N * N - MINES
  const around = (i: number) => { const x = i % N, y = Math.floor(i / N); let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && mines.has(ny * N + nx)) c++ } return c }
  const reveal = (i: number) => {
    if (dead || open.has(i)) return
    if (mines.has(i)) { setDead(true); setTimeout(() => onDone(open.size, total, true), 700); return }
    const next = new Set(open); const stack = [i]
    while (stack.length) { const k = stack.pop()!; if (next.has(k) || mines.has(k)) continue; next.add(k); if (around(k) === 0) { const x = k % N, y = Math.floor(k / N); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) stack.push(ny * N + nx) } } }
    setOpen(next)
    if (next.size >= total) setTimeout(() => onDone(next.size, total, false), 500)
  }
  return (
    <div className="fixed inset-0 z-40 bg-chrome text-chrome-fg flex flex-col items-center justify-center p-4 anim-fade">
      <h2 className="font-extrabold text-xl mb-1">{t('mines.title')}</h2>
      <p className="text-xs opacity-70 mb-3 text-center max-w-xs">{t('mines.hint', { n: MINES })}</p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${N}, 44px)` }}>
        {Array.from({ length: N * N }, (_, i) => {
          const isOpen = open.has(i) || (dead && mines.has(i))
          const n = around(i)
          return <button key={i} onClick={() => reveal(i)} className={`w-11 h-11 rounded-lg font-bold ${isOpen ? (mines.has(i) ? 'bg-health' : 'bg-surface/25') : 'bg-chrome-soft active:scale-95'}`}>{isOpen ? (mines.has(i) ? '💣' : n || '') : ''}</button>
        })}
      </div>
      <div className="mt-3 text-sm opacity-80">{t('mines.progress', { done: open.size, total })}</div>
      <button onClick={() => onDone(open.size, total, false)} className="mt-3 text-xs underline opacity-70">{t('mines.retreat')}</button>
      {dead && <div className="mt-2 font-bold">{t('mines.boom')}</div>}
    </div>
  )
}
