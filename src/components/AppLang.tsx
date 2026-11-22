import { useEffect, useRef, useState } from 'react'
import { APP_LANGS, setAppLang, t, useAppLang } from '../lib/i18n'

/** Choix de la langue de l'appli : trois étiquettes, celle choisie prend l'anneau holo.
 *  `compact` (téléphone) : une seule étiquette qui ouvre les autres. */
export function AppLangPicker({ compact = false }: { compact?: boolean }) {
  const lang = useAppLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const list = (
    <div className="lang-pick app-lang" role="radiogroup" aria-label={t("Langue de l'appli")}>
      {APP_LANGS.map((l, i) => (
        <button key={l.code} role="radio" aria-checked={lang === l.code} className={lang === l.code ? 'on' : ''} title={l.name}
          style={{ '--d': `${i * 120}deg` } as React.CSSProperties} onClick={() => { setAppLang(l.code); setOpen(false) }}>
          {l.tag}
        </button>
      ))}
    </div>
  )
  if (!compact) return list
  return (
    <div className="app-lang-c" ref={ref}>
      <button className="lang-now" aria-expanded={open} aria-label={t("Langue de l'appli")} onClick={() => setOpen(o => !o)}>
        {APP_LANGS.find(l => l.code === lang)?.tag}
      </button>
      {open && <div className="app-lang-pop">{list}</div>}
    </div>
  )
}
