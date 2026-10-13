interface Props {
  label: string
  emoji: string
  value: number
  color: string
}

export function StatBar({ label, emoji, value, color }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 text-center">{emoji}</span>
      <span className="w-20 shrink-0 opacity-80">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-black/25 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="w-8 text-end tabular-nums opacity-70">{Math.round(value)}</span>
    </div>
  )
}
