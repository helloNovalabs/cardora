import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { GAMES, gameColor, gameMeta } from '../lib/games'
import { tcgSealed, tcgSets, type TcgSealed } from '../lib/tcg'
import { canSearch, priceFor, searchCards } from '../lib/games'
import { LangPicker, buyLinks } from '../components/Lang'
import { CardFace } from '../components/CardFace'
import { ISearch } from '../components/Icons'
import { toEur } from '../lib/store'
import type { Card, Price } from '../lib/types'
import { fmt, guessKind, saveSealed, USD_TO_EUR, useCollection } from '../lib/store'
import type { GameId, SetInfo } from '../lib/types'

const MAIN: GameId[] = ['pokemon', 'onepiece', 'lorcana', 'magic', 'yugioh', 'riftbound']
const OTHERS = GAMES.filter(g => g.tcg && !MAIN.includes(g.id))
const KINDS: [RegExp, string][] = [[/./, 'Tout'], [/pack|booster(?! box)/i, 'Boosters'], [/booster box|display/i, 'Displays'], [/elite trainer|collection|premium|gift|bundle|coffret/i, 'Coffrets'], [/deck|starter/i, 'Decks']]

const cmSearch = (game: GameId, q: string) => {
  const cm = gameMeta(game)?.cm
  return cm ? `https://www.cardmarket.com/fr/${cm}/Products/Search?searchString=${encodeURIComponent(q)}` : null
}
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const when = (d?: string) => (d ? `${Number(d.slice(8, 10))} ${MOIS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : '')

type Shelf = { set: SetInfo; items: TcgSealed[] }

export default function Shop() {
  const col = useCollection()
  const [game, setGame] = useState<GameId>('pokemon')
  const [kind, setKind] = useState(0)
  const [shelves, setShelves] = useState<Shelf[] | null>(null)
  const [err, setErr] = useState(false)
  const mine = new Set((col.sealed ?? []).map(x => x.id))
  const [q, setQ] = useState('')
  const [lang, setLang] = useState<string | undefined>()
  const [found, setFound] = useState<Card[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [prices, setPrices] = useState<Record<string, Price | null>>({})

  // Chercher une carte à acheter
  useEffect(() => {
    const t = q.trim()
    if (t.length < 2 || !canSearch(game)) { setFound(null); return }
    setBusy(true)
    const id = window.setTimeout(() => {
      searchCards(game, t).then(list => {
        setFound(list)
        // Le prix des 12 premières, une par une
        for (const c of list.slice(0, 12)) priceFor(c).then(p => setPrices(x => ({ ...x, [c.key]: p })))
      }).catch(() => setFound([])).finally(() => setBusy(false))
    }, 400)
    return () => window.clearTimeout(id)
  }, [q, game])

  useEffect(() => {
    const cat = gameMeta(game)?.tcg
    if (!cat) return
    let live = true
    setShelves(null); setErr(false)
    ;(async () => {
      const soon = new Date(Date.now() + 120 * 86400_000).toISOString().slice(0, 10)
      // Les dernières extensions et les précommandes (jusqu'à 4 mois). Rangées par ordre d'ajout chez TCGplayer :
      // leurs dates sont parfois changées pour de vieilles extensions.
      const sets = (await tcgSets(cat)).filter(s => (s.date ?? '') <= soon).sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 6)
      const out: Shelf[] = []
      for (const s of sets) {
        const items = await tcgSealed(cat, s.id).catch(() => [] as TcgSealed[])
        if (items.some(x => x.image)) out.push({ set: s, items: items.filter(x => x.image) })
        if (live) setShelves([...out])
      }
      if (live && !out.length) setShelves([])
    })().catch(() => live && setErr(true))
    return () => { live = false }
  }, [game])

  const addMine = (x: TcgSealed, set: SetInfo) => saveSealed({
    id: `tcg-${x.id}`, game, kind: guessKind(x.name), name: x.name, setName: set.name, logo: set.logo,
    qty: 1, buy: null, value: x.price?.value != null ? Math.round(x.price.value * USD_TO_EUR * 100) / 100 : null,
    valueAt: x.price ? Date.now() : null, addedAt: Date.now(), image: x.image || undefined, src: x.src,
  })

  return (
    <div className="stack fade-in shop" style={{ gap: 18, '--gc': gameColor(game) } as CSSProperties}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Boutique</h1>
        <p className="muted small" style={{ maxWidth: 620 }}>
          Cherche la carte qu'il te manque, ou regarde les dernières sorties : boosters, displays, coffrets, avec le prix du marché.
          Tu achètes chez le vendeur de ton choix. Cardora ne vend rien et ne touche rien sur tes achats.
        </p>
      </div>

      <div className="hunt">
        <div className="search"><ISearch /><input className="field" placeholder={`Quelle carte tu cherches ? (${gameMeta(game)?.name})`} value={q} onChange={e => setQ(e.target.value)} /></div>
        <LangPicker value={lang} onChange={setLang} any label="Langue de la carte cherchée" />
      </div>

      <div className="chips">
        {MAIN.map(id => (
          <button key={id} className={'chip' + (game === id ? ' on' : '')} style={{ '--gc': gameColor(id) } as CSSProperties} onClick={() => setGame(id)}><i />{gameMeta(id)?.name}</button>
        ))}
        <select className="field chip-select" value={MAIN.includes(game) ? '' : game} onChange={e => e.target.value && setGame(e.target.value as GameId)} aria-label="Autres jeux">
          <option value="">Autres jeux…</option>
          {OTHERS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      {q.trim().length < 2 && <div className="chips" role="group" aria-label="Type de produit">
        {KINDS.map(([, l], i) => <button key={l} className="chip-btn" aria-pressed={kind === i} onClick={() => setKind(i)}>{l}</button>)}
      </div>}

      {q.trim().length >= 2 && (
        <section className="stack" style={{ gap: 10 }}>
          <div className="sec-h"><h2>Où trouver « {q.trim()} »</h2>{found && <span className="muted small">{found.length} carte{found.length > 1 ? 's' : ''}</span>}</div>
          {!canSearch(game) && (
            <div className="box stack">
              <p className="small">Pour {gameMeta(game)?.name}, je t'emmène directement chez les vendeurs :</p>
              <div className="row wrap" style={{ gap: 8 }}>{buyLinks(game, q.trim(), lang).map((l, i) => <a key={l.name} className={'btn sm' + (i ? '' : ' primary')} href={l.url} target="_blank" rel="noreferrer">{l.name}</a>)}</div>
            </div>
          )}
          {busy && <div className="shop-grid">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skel" style={{ height: 300 }} />)}</div>}
          {found && !busy && found.length === 0 && <p className="muted small">Aucune carte trouvée. Vérifie l'orthographe ou essaie le nom en anglais.</p>}
          {found && !busy && found.length > 0 && (
            <div className="shop-grid">
              {found.slice(0, 24).map(c => {
                const p = prices[c.key]
                                return (
                  <article key={c.key} className="prod hunt-card">
                    <Link to={`/carte/${c.game}/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.id)}`} className="hunt-pic"><CardFace card={c} /></Link>
                    <h3 title={c.name}>{c.name}</h3>
                    <span className="tiny muted">{c.setName ?? c.setId.toUpperCase()} · n° {c.number}</span>
                    <div className="prod-price">{p === undefined ? <span className="tiny muted">Prix…</span> : p ? <><b>{fmt(toEur(p) ?? 0)}</b><span className="tiny muted">prix du marché, toutes langues</span></> : <span className="tiny muted">Pas de prix connu</span>}</div>
                    <div className="prod-act">{buyLinks(c.game, c.name, lang, c.number).map((l, i) => <a key={l.name} className={'btn sm' + (i ? '' : ' primary')} href={l.url} target="_blank" rel="noreferrer">{l.name}</a>)}</div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {err && <p className="down small">Impossible de charger la boutique. Vérifie ta connexion et réessaie.</p>}
      {!shelves && !err && <div className="shop-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skel" style={{ height: 260 }} />)}</div>}
      {shelves && shelves.length === 0 && <p className="muted small empty">Pas encore de produits avec photo pour ce jeu.</p>}

      {shelves?.map(({ set, items }) => {
        const list = items.filter(x => KINDS[kind][0].test(x.name))
        if (!list.length) return null
        const soon = set.soon
        return (
          <section key={set.id} className="stack" style={{ gap: 10 }}>
            <div className="sec-h">
              <h2>{set.name}</h2>
              <span className={'badge' + (soon ? ' soon' : '')}>{soon ? `Sortie le ${when(set.date)}` : `Sorti le ${when(set.date)}`}</span>
            </div>
            <div className="shop-grid">
              {list.slice(0, 12).map(x => {
                const cm = cmSearch(game, x.name.replace(/\s*\[.*?\]\s*/g, ' '))
                const have = mine.has(`tcg-${x.id}`)
                return (
                  <article key={x.id} className="prod">
                    <div className="prod-pic"><img src={x.image.replace('_400w', '_in_1000x1000')} alt="" loading="lazy" onError={e => { e.currentTarget.src = x.image }} /></div>
                    <h3 title={x.name}>{x.name}</h3>
                    <div className="prod-price">
                      {x.price?.value != null ? <><b>{fmt(x.price.value * USD_TO_EUR)}</b><span className="tiny muted">prix du marché ({fmt(x.price.value, 'USD')})</span></> : <span className="tiny muted">{soon ? 'Pas encore de prix' : 'Pas de prix'}</span>}
                    </div>
                    <div className="prod-act">
                      {cm && <a className="btn sm primary" href={cm} target="_blank" rel="noreferrer">Cardmarket</a>}
                      <a className={'btn sm' + (cm ? '' : ' primary')} href={`https://www.tcgplayer.com/product/${x.id}`} target="_blank" rel="noreferrer">TCGplayer</a>
                      <button className="btn sm ghost" disabled={have} onClick={() => addMine(x, set)} title="L'ajouter à ton scellé, page Investir">{have ? '✓ Dans mon scellé' : "Je l'ai"}</button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
      {shelves && shelves.length > 0 && (
        <p className="muted tiny">Prix TCGplayer (via TCGCSV) convertis en euros, mis à jour chaque jour. Sur Cardmarket le prix peut être différent. « Je l'ai » range le produit dans ton scellé, sur la page <Link to="/investir">Investir</Link>.</p>
      )}
    </div>
  )
}
