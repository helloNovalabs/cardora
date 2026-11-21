import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { fmt } from '../lib/store'

/** Carte qui bascule en 3D et brille comme une holo quand on la touche ou la survole. */
export function HoloCard({ src, alt, rare = true, className = '', style }: { src: string; alt: string; rare?: boolean; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const move = (e: PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    el.style.setProperty('--rx', `${(0.5 - y) * 22}deg`)
    el.style.setProperty('--ry', `${(x - 0.5) * 26}deg`)
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
  }
  const reset = () => {
    setActive(false)
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg')
  }
  return (
    <div className={'holo-wrap ' + className} style={style}>
      <div
        ref={ref}
        className={'holo' + (active ? ' on' : '') + (rare ? ' rare' : '')}
        onPointerEnter={() => setActive(true)}
        onPointerDown={e => { setActive(true); move(e) }}
        onPointerMove={move}
        onPointerLeave={reset}
        onPointerUp={e => { if (e.pointerType !== 'mouse') reset() }}
      >
        <img src={src} alt={alt} draggable={false} />
        <span className="holo-shine" />
        <span className="holo-glare" />
      </div>
    </div>
  )
}

/** Petite courbe : moyenne 30 j → 7 j → 1 j → aujourd'hui. */
export function PriceChart({ points, currency }: { points: { label: string; v: number | null | undefined }[]; currency: 'EUR' | 'USD' }) {
  const pts = points.filter(p => p.v != null) as { label: string; v: number }[]
  if (pts.length < 2) return null
  const W = 320, H = 120, P = 32
  const min = Math.min(...pts.map(p => p.v)), max = Math.max(...pts.map(p => p.v))
  const span = max - min || max * 0.1 || 1
  const xy = pts.map((p, i) => [P + (i * (W - P * 2)) / (pts.length - 1), H - 26 - ((p.v - min) / span) * (H - 50)])
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${xy[xy.length - 1][0]},${H - 18} L${xy[0][0]},${H - 18} Z`
  const up = pts[pts.length - 1].v >= pts[0].v
  const c = up ? 'var(--up)' : 'var(--down)'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Évolution du prix : ${pts.map(p => `${p.label} ${fmt(p.v, currency)}`).join(', ')}`}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={up ? '#4ADE80' : '#FB7185'} stopOpacity=".35" />
          <stop offset="1" stopColor={up ? '#4ADE80' : '#FB7185'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cg)" />
      <path d={line} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />
      {xy.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === xy.length - 1 ? 5 : 3.5} fill={i === xy.length - 1 ? c : '#0D0B14'} stroke={c} strokeWidth="2" />
          <text x={x} y={y - 10} textAnchor="middle" className="chart-v">{fmt(pts[i].v, currency)}</text>
          <text x={x} y={H - 4} textAnchor="middle" className="chart-l">{pts[i].label}</text>
        </g>
      ))}
    </svg>
  )
}

/** Anneau de progression. Sans couleur donnée, il prend le reflet holo de Cardora. */
export function Ring({ pct, size = 54, stroke = 6, color, children }: { pct: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const id = useId().replace(/:/g, '')
  const r = (size - stroke) / 2, C = 2 * Math.PI * r
  const [p, setP] = useState(0)
  useEffect(() => { const t = requestAnimationFrame(() => setP(Math.min(100, pct))); return () => cancelAnimationFrame(t) }, [pct])
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B6CFF" /><stop offset=".5" stopColor="#F472B6" /><stop offset="1" stopColor="#67E8F9" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(196,181,253,.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color ?? `url(#r${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - p / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <span>{children ?? `${Math.round(pct)}%`}</span>
    </div>
  )
}

/** Donut : part de chaque jeu dans la valeur de la collection. */
export function Donut({ parts, size = 132, children }: { parts: { label: string; value: number; color: string }[]; size?: number; children?: React.ReactNode }) {
  const total = parts.reduce((n, p) => n + p.value, 0)
  if (!total) return null
  const r = size / 2 - 12, C = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
    <svg width={size} height={size} className="donut" role="img" aria-label={parts.map(p => `${p.label} ${Math.round((p.value / total) * 100)} %`).join(', ')}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(196,181,253,.1)" strokeWidth="14" />
      {parts.map(p => {
        const len = (p.value / total) * C
        const el = (
          <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${Math.max(0, len - 16)} ${C}`} strokeDashoffset={-acc} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        )
        acc += len
        return el
      })}
    </svg>
    {children && <div className="donut-c">{children}</div>}
    </div>
  )
}

/** Pluie de confettis (quand un classeur est complet). */
export function Confetti() {
  const colors = ['#8B6CFF', '#C4B5FD', '#F472B6', '#67E8F9', '#4ADE80', '#FFFFFF']
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 12) * 0.08}s`, transform: `rotate(${i * 29}deg)` }} />
      ))}
    </div>
  )
}

/** Sélecteur avec un fond qui glisse sous l'option choisie. */
export function Seg<T extends string>({ value, onChange, options, full = false }: { value: T; onChange: (v: T) => void; options: [T, string][]; full?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ind, setInd] = useState({ left: 4, width: 0 })
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLButtonElement>(`[data-v="${value}"]`)
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, options.map(o => o[1]).join()])
  return (
    <div className={'seg' + (full ? ' full' : '')} ref={ref} role="tablist">
      <span className="ind" style={ind} />
      {options.map(([k, l]) => (
        <button key={k} data-v={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  )
}

