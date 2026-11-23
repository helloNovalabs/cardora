import type { CSSProperties } from 'react'

const P = (p: string) => `https://assets.tcgdex.net/fr/${p}/low.webp`
const POOL = [
  P('sv/sv03.5/199'), P('me/me04/105'), 'https://tcgplayer-cdn.tcgplayer.com/product/732599_200w.jpg', P('sv/sv08.5/156'), P('me/me01/161'), P('sv/sv10/214'),
  'https://images.ygoprodeck.com/images/cards_small/89631139.jpg', P('sv/sv08.5/166'), P('me/me03/107'), P('sv/sv06.5/082'), 'https://www.laststicker.com/i/cards/11964/1.jpg', P('me/me02.5/272'),
  P('sv/sv08/222'), P('sv/sv03.5/187'), 'https://www.laststicker.com/i/cards/11771/247.jpg', P('sv/sv08.5/146'), P('sv/sv10/201'), P('me/me04/091'),
  P('me/me01/139'), P('sv/sv03.5/171'), P('sv/sv06.5/069'), P('me/me02.5/241'), P('sv/sv08/199'), P('swsh/swsh12.5/160'),
  P('me/me03/093'), P('sv/sv10/190'), P('me/me02.5/227'), P('sv/sv08.5/137'), P('sv/sv06.5/075'), P('me/me04/097'),
]

/** Le mur : de vraies cartes qui défilent en colonnes, penchées. */
export function CardWall({ columns = 6 }: { columns?: number }) {
  const per = Math.floor(POOL.length / columns)
  return (
    <div className="wall" aria-hidden style={{ '--cols': columns } as CSSProperties}>
      <div className="wall-in">
        {Array.from({ length: columns }, (_, c) => {
          const list = POOL.slice(c * per, c * per + per)
          return (
            <div key={c} className={'wall-col' + (c % 2 ? ' rev' : '')} style={{ '--t': `${64 + c * 7}s` } as CSSProperties}>
              {[...list, ...list].map((src, i) => <img key={i} src={src} alt="" referrerPolicy="no-referrer" draggable={false} />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
