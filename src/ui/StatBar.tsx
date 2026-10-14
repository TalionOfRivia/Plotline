import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  emoji: string
  value: number
  color: string
}

/** A stat bar that briefly shows the delta whenever its value changes. */
export function StatBar({ label, emoji, value, color }: Props) {
  const prev = useRef(value)
  const [delta, setDelta] = useState<number | null>(null)
  useEffect(() => {
    const d = Math.round(value - prev.current)
    prev.current = value
    if (d !== 0) {
      setDelta(d)
      const id = setTimeout(() => setDelta(null), 1400)
      return () => clearTimeout(id)
    }
  }, [value])

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 text-center">{emoji}</span>
      <span className="w-20 shrink-0 opacity-80">{label}</span>
      <div className="relative flex-1 h-3 rounded-full bg-black/25 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="relative w-8 text-end tabular-nums opacity-70">
        {Math.round(value)}
        {delta !== null && (
          <span className={`absolute -top-3 end-0 text-[11px] font-bold anim-rise ${delta > 0 ? 'text-money' : 'text-health'}`}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </span>
    </div>
  )
}
