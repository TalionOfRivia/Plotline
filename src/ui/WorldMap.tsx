import { useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Geometry } from 'geojson'
import topo from 'world-atlas/countries-110m.json'
import { COUNTRIES, COUNTRY_BY_CODE } from '../engine/people'

const W = 960, H = 480

interface Shape { code: string; d: string; cx: number; cy: number }

/** Build the SVG path per country once (numeric ISO id → our alpha-2 code). */
function buildShapes(): { shapes: Shape[]; pins: { code: string; x: number; y: number }[]; project: (lon: number, lat: number) => [number, number] } {
  const projection = geoNaturalEarth1().fitSize([W, H], { type: 'Sphere' })
  const path = geoPath(projection)
  const t = topo as unknown as Topology<{ countries: GeometryCollection }>
  const fc = feature(t, t.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>
  const byNumeric: Record<string, string> = {}
  for (const c of COUNTRIES) if (c.numeric) byNumeric[c.numeric] = c.code
  const shapes: Shape[] = []
  const have = new Set<string>()
  for (const f of fc.features) {
    const code = byNumeric[String(f.id).padStart(3, '0')]
    if (!code) continue
    const d = path(f)
    if (!d) continue
    const [cx, cy] = path.centroid(f)
    shapes.push({ code, d, cx, cy })
    have.add(code)
  }
  const project = (lon: number, lat: number) => (projection([lon, lat]) ?? [0, 0]) as [number, number]
  // countries too small for the 110m topology get a pin at their capital
  const pins = COUNTRIES.filter((c) => !have.has(c.code) && c.lat !== undefined).map((c) => {
    const [x, y] = project(c.lon!, c.lat!)
    return { code: c.code, x, y }
  })
  return { shapes, pins, project }
}

interface Props {
  value: string
  onChange: (code: string) => void
  label: (code: string) => string
}

/** Interactive world map: tap to choose, drag to pan, wheel/pinch to zoom, glides to the selection. */
export function WorldMap({ value, onChange, label }: Props) {
  const { shapes, pins, project } = useMemo(buildShapes, [])
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [hover, setHover] = useState<string | null>(null)
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null)
  const pinch = useRef<{ d: number; k: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Glide to the selected country
  useEffect(() => {
    const c = COUNTRY_BY_CODE[value]
    const s = shapes.find((x) => x.code === value)
    const [tx, ty] = s ? [s.cx, s.cy] : c?.lat !== undefined ? project(c.lon!, c.lat!) : [W / 2, H / 2]
    const k = 2.2
    setView({ k, x: W / 2 - tx * k, y: H / 2 - ty * k })
  }, [value, shapes, project])

  const clampView = (v: { x: number; y: number; k: number }) => {
    const k = Math.min(8, Math.max(1, v.k))
    const x = Math.min(0, Math.max(W - W * k, v.x))
    const y = Math.min(0, Math.max(H - H * k, v.y))
    return { x, y, k }
  }

  // pointer handlers: pan with one finger / mouse, pinch with two
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const onDown = (e: React.PointerEvent) => {
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch { /* synthetic or already-released pointer */ }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const code = (e.target as Element).closest?.('[data-code]')?.getAttribute('data-code') ?? null
    if (pointers.current.size === 1) { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false }; tapTarget.current = code }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }
      drag.current = null
      pinched.current = true
    }
  }
  const scale = () => (svgRef.current ? W / svgRef.current.getBoundingClientRect().width : 1)
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const k = pinch.current.k * (d / pinch.current.d)
      setView((v) => zoomAt(v, k, (a.x + b.x) / 2, (a.y + b.y) / 2))
      return
    }
    if (drag.current) {
      const dx = (e.clientX - drag.current.x) * scale(), dy = (e.clientY - drag.current.y) * scale()
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
      setView((v) => clampView({ ...v, x: drag.current!.vx + dx, y: drag.current!.vy + dy }))
    }
  }
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) {
      const moved = drag.current?.moved
      drag.current = null
      // a clean tap (no pan, no pinch) selects the country under the finger
      if (!moved && tapTarget.current && !pinched.current) onChange(tapTarget.current)
      tapTarget.current = null
      pinched.current = false
    }
  }
  const tapTarget = useRef<string | null>(null)
  const pinched = useRef(false)
  const zoomAt = (v: { x: number; y: number; k: number }, k: number, clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * W, py = ((clientY - rect.top) / rect.height) * H
    const nk = Math.min(8, Math.max(1, k))
    const r = nk / v.k
    return clampView({ k: nk, x: px - (px - v.x) * r, y: py - (py - v.y) * r })
  }
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setView((v) => zoomAt(v, v.k * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY))
  }

  const sel = shapes.find((s) => s.code === value)
  const selPin = pins.find((p) => p.code === value)
  const [fx, fy] = sel ? [sel.cx, sel.cy] : selPin ? [selPin.x, selPin.y] : [W / 2, H / 2]

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#0b1322] shadow-inner select-none" style={{ touchAction: 'none' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full block"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
        <defs>
          <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#13213a" />
            <stop offset="100%" stopColor="#070d18" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#ocean)" />
        <g style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transition: drag.current || pinch.current ? 'none' : 'transform .6s cubic-bezier(.2,.8,.2,1)' }}>
          {/* graticule-ish subtle grid */}
          {Array.from({ length: 11 }, (_, i) => <line key={'v' + i} x1={(i * W) / 10} y1={0} x2={(i * W) / 10} y2={H} stroke="#1c2b47" strokeWidth={0.6 / view.k} />)}
          {Array.from({ length: 6 }, (_, i) => <line key={'h' + i} x1={0} y1={(i * H) / 5} x2={W} y2={(i * H) / 5} stroke="#1c2b47" strokeWidth={0.6 / view.k} />)}
          {shapes.map((s) => {
            const active = s.code === value, hot = s.code === hover
            return (
              <path key={s.code} d={s.d}
                fill={active ? '#2ec4b6' : hot ? '#3b5a8a' : '#24395c'}
                stroke={active ? '#9ff5ec' : '#0b1322'} strokeWidth={(active ? 1.6 : 0.5) / view.k}
                filter={active ? 'url(#glow)' : undefined}
                style={{ transition: 'fill .2s', cursor: 'pointer' }}
                data-code={s.code}
                onPointerEnter={() => setHover(s.code)} onPointerLeave={() => setHover(null)}>
                <title>{label(s.code)}</title>
              </path>
            )
          })}
          {pins.map((p) => (
            <circle key={p.code} cx={p.x} cy={p.y} r={(p.code === value ? 5 : 3) / view.k}
              fill={p.code === value ? '#2ec4b6' : '#6f8bb5'} stroke="#0b1322" strokeWidth={0.6 / view.k}
              data-code={p.code} style={{ cursor: 'pointer' }}>
              <title>{label(p.code)}</title>
            </circle>
          ))}
          {/* pulse ring on the selection */}
          <circle cx={fx} cy={fy} r={10 / view.k} fill="none" stroke="#2ec4b6" strokeWidth={1.5 / view.k} className="map-pulse" />
          <circle cx={fx} cy={fy} r={2.5 / view.k} fill="#fff" />
        </g>
      </svg>
      <div className="absolute bottom-2 start-2 end-2 flex items-center justify-between pointer-events-none">
        <span className="text-xs text-white/90 bg-black/40 rounded-full px-2 py-1 backdrop-blur">{COUNTRY_BY_CODE[value]?.flag} {label(value)}</span>
        {hover && hover !== value && <span className="text-xs text-white/70 bg-black/40 rounded-full px-2 py-1 backdrop-blur">{label(hover)}</span>}
      </div>
      <div className="absolute top-2 end-2 flex flex-col gap-1">
        <button className="w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur active:scale-90" onClick={() => setView((v) => clampView({ ...zoomAt(v, v.k * 1.5, centerX(), centerY()) }))}>+</button>
        <button className="w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur active:scale-90" onClick={() => setView((v) => clampView({ ...zoomAt(v, v.k / 1.5, centerX(), centerY()) }))}>−</button>
      </div>
    </div>
  )

  function centerX() { const r = svgRef.current!.getBoundingClientRect(); return r.left + r.width / 2 }
  function centerY() { const r = svgRef.current!.getBoundingClientRect(); return r.top + r.height / 2 }
}
