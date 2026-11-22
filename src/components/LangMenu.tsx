import { useEffect, useRef, useState } from 'react'

export type LangOption = { code: string; label: string; tag?: string }

/** Le seul choix de langue de Cardora : un bouton, une petite liste. */
export function LangMenu({ value, options, onChange, label, short = false, up = false }: { value: string; options: LangOption[]; onChange: (code: string) => void; label: string; short?: boolean; up?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', out)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [open])
  const now = options.find(o => o.code === value) ?? options[0]
  return (
    <div className={'lm' + (up ? ' up' : '')} ref={ref}>
      <button type="button" className="lm-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label} : ${now.label}`} onClick={() => setOpen(o => !o)}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3.8 6 3.8 9S15 18 12 21c-3-3-3.8-6-3.8-9S9 6 12 3Z" /></svg>
        <span>{short ? now.tag ?? now.label : now.label}</span>
        <i aria-hidden />
      </button>
      {open && (
        <ul className="lm-list" role="listbox" aria-label={label}>
          {options.map(o => (
            <li key={o.code}>
              <button type="button" role="option" aria-selected={o.code === value} onClick={() => { setOpen(false); if (o.code !== value) onChange(o.code) }}>{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
