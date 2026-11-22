import { useState, type CSSProperties } from 'react'
import type { SealedKind } from '../lib/store'

export const KINDS: { id: SealedKind; short: string; long: string }[] = [
  { id: 'booster', short: 'Booster', long: 'Booster' },
  { id: 'display', short: 'Display', long: 'Display (boîte de boosters)' },
  { id: 'etb', short: 'ETB', long: 'Coffret Dresseur d’élite / premium' },
  { id: 'coffret', short: 'Coffret', long: 'Coffret' },
  { id: 'tin', short: 'Tin', long: 'Boîte métal (tin)' },
  { id: 'deck', short: 'Deck', long: 'Deck' },
]
export const kindLabel = (k: SealedKind) => KINDS.find(x => x.id === k)?.long ?? k

/** Dessin d'un objet scellé (booster, display, coffret…) aux couleurs du jeu, avec le logo de l'extension.
 *  Pas de photo libre de droits pour ces produits : on les dessine. `size` = largeur de la scène en px. */
export function SealedArt({ kind, color, logo, label, size = 120, invert = false }: {
  kind: SealedKind; color: string; logo?: string; label?: string; size?: number; invert?: boolean
}) {
  const style = { '--gc': color, fontSize: size / 10 } as CSSProperties
  const face = <Face logo={logo} label={label} invert={invert} />
  return (
    <div className={'sx sx-' + kind} style={style} aria-hidden="true">
      {kind === 'booster' && <div className="sx-pack"><span className="sx-crimp t" />{face}<span className="sx-crimp b" /></div>}
      {kind === 'display' && (
        <div className="sx-box3d">
          <div className="sx-peek">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
          <div className="sx-front">{face}</div>
        </div>
      )}
      {kind === 'etb' && <div className="sx-box3d"><div className="sx-lid" /><div className="sx-front">{face}</div></div>}
      {kind === 'coffret' && (
        <div className="sx-box3d"><div className="sx-front"><span className="sx-window"><i /><i /></span>{face}</div></div>
      )}
      {kind === 'tin' && <div className="sx-tin">{face}</div>}
      {kind === 'deck' && <div className="sx-deck"><span className="sx-fan"><i /><i /><i /></span><div className="sx-front">{face}</div></div>}
    </div>
  )
}

function Face({ logo, label, invert }: { logo?: string; label?: string; invert: boolean }) {
  const [bad, setBad] = useState(false)
  return (
    <span className="sx-face">
      {logo && !bad
        ? <img src={logo} alt="" loading="lazy" onError={() => setBad(true)} style={invert ? { filter: 'invert(1)' } : undefined} />
        : <b>{label}</b>}
    </span>
  )
}
