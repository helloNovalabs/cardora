import { useEffect, useId, useRef, useState } from 'react'
import { fmt } from '../lib/store'

/** Logo Cardora : deux cartes en éventail, celle de devant en reflet holo. */
export function Logo({ size = 30 }: { size?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo">
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B6CFF" />
          <stop offset=".45" stopColor="#F472B6" />
          <stop offset=".75" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#C4B5FD" />
        </linearGradient>
      </defs>
      <rect x="4.5" y="6" width="14" height="20" rx="3" transform="rotate(-14 11.5 16)" fill="#241C3B" stroke="#C4B5FD" strokeOpacity=".55" strokeWidth="1.2" />
      <rect x="12" y="5" width="14" height="20" rx="3" transform="rotate(9 19 15)" fill={`url(#f${id})`} />
      <path d="M19.4 10.6c.4 2.6 1.2 3.4 3.8 3.8-2.6.4-3.4 1.2-3.8 3.8-.4-2.6-1.2-3.4-3.8-3.8 2.6-.4 3.4-1.2 3.8-3.8Z" fill="#fff" transform="rotate(9 19 15)" />
    </svg>
  )
}

export function Brand() {
  return <span className="brand"><Logo />Cardora</span>
}

const reduce = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Montant qui défile jusqu'à sa valeur (une fois, puis suit les changements en douceur). */
export function CountUp({ value, currency = 'EUR', className }: { value: number; currency?: 'EUR' | 'USD'; className?: string }) {
  const [shown, setShown] = useState(reduce() ? value : 0)
  const from = useRef(shown)
  useEffect(() => {
    if (reduce()) { setShown(value); return }
    const start = performance.now(), a = from.current, d = 900
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / d), e = 1 - Math.pow(1 - k, 3)
      const v = a + (value - a) * e
      setShown(v); from.current = v
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{fmt(shown, currency)}</span>
}
