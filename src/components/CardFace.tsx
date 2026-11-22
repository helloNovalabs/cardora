import type { CSSProperties } from 'react'
import type { Card } from '../lib/types'
import { sportColors } from '../lib/sport'

/** L'image d'une carte, ou son dessin quand il n'y a pas de photo (foot, F1). */
export function CardFace({ card, big = false }: { card: Card; big?: boolean }) {
  if (card.image) return <img src={card.image} alt="" loading="lazy" draggable={false} />
  if (card.game === 'foot' || card.game === 'f1') return <SportCard card={card} big={big} />
  return <div className="noimg">{card.name}<br />n° {card.number}</div>
}

const initials = (n: string) => n.split(/[\s-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
const last = (n: string) => { const p = n.split(' '); return p.length > 1 ? p.slice(1).join(' ') : n }

/** Carte dessinée aux couleurs de l'équipe : vignette Panini (foot) ou carte chromée (F1). */
export function SportCard({ card, big = false }: { card: Card; big?: boolean }) {
  const [a, b] = sportColors(card)
  const k = card.extra?.k
  const style = { '--a': a, '--b': b } as CSSProperties
  if (card.game === 'foot') {
    return (
      <div className={'sc sc-foot' + (big ? ' big' : '') + (k ? ' k-' + k : '')} style={style}>
        <span className="sc-band" />
        <span className="sc-code">{card.extra?.code}</span>
        <span className="sc-no">{card.number.replace(/^[A-Z]+\s/, '')}</span>
        {k === 'crest' ? (
          <span className="sc-crest"><b>{card.extra?.code}</b></span>
        ) : k === 'team' ? (
          <span className="sc-team">{Array.from({ length: 11 }, (_, i) => <i key={i} />)}</span>
        ) : k === 'history' ? (
          <span className="sc-cup">🏆</span>
        ) : (
          <span className="sc-player"><i className="head" /><i className="body" /><b>{initials(card.name)}</b></span>
        )}
        <span className="sc-name">
          <b>{k === 'crest' || k === 'team' || k === 'history' ? card.name : last(card.name)}</b>
          <small>{card.extra?.team}{card.rarity && k !== 'crest' && k !== 'team' ? `, ${card.rarity}` : ''}</small>
        </span>
      </div>
    )
  }
  return (
    <div className={'sc sc-f1' + (big ? ' big' : '')} style={style}>
      <span className="sc-chrome" />
      <span className="sc-stripe" />
      <span className="sc-no">#{card.number}</span>
      {card.extra?.rc && <span className="sc-rc">RC</span>}
      <span className="sc-car"><i /></span>
      <span className="sc-big">{initials(card.name)}</span>
      <span className="sc-name">
        <b>{card.name}</b>
        <small>{card.extra?.sub}</small>
      </span>
    </div>
  )
}
