import { t } from '../lib/i18n'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand, CountUp } from '../components/Brand'
import { AppLangPicker } from '../components/AppLang'
import { CardFace } from '../components/CardFace'
import { CardWall } from '../components/CardWall'
import { SealedArt } from '../components/Sealed'
import { PICK_GAMES as GAMES } from '../lib/games'
import { marketCards, type MarketCard } from '../lib/market'
import { fmt } from '../lib/store'
import { markSeen } from '../lib/seen'
import '../landing.css'

const pct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(Math.abs(n) < 10 ? 1 : 0)} %`
const IMG = (p: string) => `https://assets.tcgdex.net/fr/${p}/low.webp`

/** Le classeur d'essai : de vraies cartes, leur vrai prix du jour. */
function TryBinder({ list }: { list: MarketCard[] }) {
  const [on, setOn] = useState<Record<string, boolean>>({})
  const cards = useMemo(() => [...list].filter(m => m.price.value! <= 400).sort((a, b) => b.price.value! - a.price.value!).slice(0, 9), [list])
  const total = cards.reduce((n, m) => n + (on[m.card.key] ? m.price.value! : 0), 0)
  const count = cards.filter(m => on[m.card.key]).length
  return (
    <section className="ld-try">
      <div className="ld-try-copy">
        <h2>{t('Essaie. Touche les cartes que tu as.')}</h2>
        <div className="ld-total">
          <CountUp value={total} className="ld-total-v" />
          <span>{count === 0 ? t('Ta collection, pour l’instant') : t(count > 1 ? '{n} cartes, au prix Cardmarket du jour' : '{n} carte, au prix Cardmarket du jour', { n: count })}</span>
        </div>
      </div>
      <div className="ld-page">
        {cards.length === 0 ? Array.from({ length: 9 }, (_, i) => <div key={i} className="ld-pocket skel" />) : cards.map(m => (
          <button key={m.card.key} className={'ld-pocket' + (on[m.card.key] ? ' on' : '')} aria-pressed={!!on[m.card.key]} aria-label={`${m.card.name}, ${fmt(m.price.value)}`}
            onClick={() => setOn(x => ({ ...x, [m.card.key]: !x[m.card.key] }))}>
            <CardFace card={m.card} />
            <b>{fmt(m.price.value)}</b>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Landing() {
  const nav = useNavigate()
  const [market, setMarket] = useState<MarketCard[]>([])
  useEffect(() => { document.title = t('Cardora : toutes tes cartes, un seul classeur'); return () => { document.title = 'Cardora' } }, [])
  useEffect(() => { let live = true; marketCards().then(l => { if (live) setMarket(l) }).catch(() => {}); return () => { live = false } }, [])
  const open = () => { markSeen(); nav('/') }
  const moving = useMemo(() => market.filter(m => m.trend != null).sort((a, b) => Math.abs(b.trend!) - Math.abs(a.trend!)).slice(0, 14), [market])
  const rising = useMemo(() => market.filter(m => (m.trend ?? 0) > 0).sort((a, b) => b.trend! - a.trend!).slice(0, 5), [market])
  const tick = (m: MarketCard) => <span key={m.card.key}><b>{m.card.name}</b> {fmt(m.price.value)} <em className={m.trend! >= 0 ? 'up' : 'down'}>{pct(m.trend!)}</em></span>

  return (
    <div className="ld">
      <header className="ld-top">
        <Brand />
        <span className="ld-top-r"><AppLangPicker compact /><button className="btn sm" onClick={open}>{t("Ouvrir l'appli")}</button></span>
      </header>

      <section className="ld-hero">
        <CardWall />
        <div className="ld-copy">
          <h1>{t('Tes cartes valent combien ?')}</h1>
          <p>{t('Coche ce que tu as. Cardora te donne sa valeur en euros, au prix du marché, jour après jour.')}</p>
          <div className="ld-cta">
            <button className="btn primary lg" onClick={open}>{t('Ouvrir mon classeur')}</button>
            <span>{t('Gratuit, sans compte pour commencer.')}</span>
          </div>
        </div>
      </section>

      {moving.length > 0 && (
        <div className="ld-ticker" aria-label={t('Les prix qui bougent')}>
          <div style={{ '--t': `${moving.length * 5}s` } as CSSProperties}>
            <div>{moving.map(tick)}</div>
            <div aria-hidden>{moving.map(tick)}</div>
          </div>
        </div>
      )}

      <TryBinder list={market} />

      {rising.length > 0 && (
        <section className="ld-rise">
          <h2>{t('Vois ce qui monte avant tout le monde.')}</h2>
          <ol>
            {rising.map(m => (
              <li key={m.card.key}>
                <Link to={`/carte/pokemon/${encodeURIComponent(m.card.setId)}/${encodeURIComponent(m.card.id)}`} onClick={markSeen}>
                  <span className="pic"><CardFace card={m.card} /></span>
                  <span className="nm"><b>{m.card.name}</b><small>{m.card.setName}</small></span>
                  <span className="pr">{fmt(m.price.value)}</span>
                  <em className="up">{pct(m.trend!)}</em>
                </Link>
              </li>
            ))}
          </ol>
          <p>{t('Moyenne sur 7 jours comparée à celle sur 30 jours, sur Cardmarket. Ce n’est pas un conseil d’achat.')}</p>
        </section>
      )}

      <section className="ld-tools">
        <article>
          <h2>{t('Scanne')}</h2>
          <p>{t('Prends ta carte en photo. Cardora lit son nom et son numéro.')}</p>
          <div className="v scan"><img src={IMG('sv/sv08.5/156')} alt="" loading="lazy" /><i /></div>
        </article>
        <article>
          <h2>{t('Grade')}</h2>
          <p>{t('Sache si une carte vaut le coup d’être envoyée chez PSA, CGC ou PCA.')}</p>
          <div className="v"><div className="slab ld-slab"><div className="slab-label psa"><div style={{ minWidth: 0 }}><div className="co">PSA</div></div><div className="g">10</div></div><img src={IMG('sv/sv03.5/199')} alt="" loading="lazy" /></div></div>
        </article>
        <article>
          <h2>{t('Échange')}</h2>
          <p>{t('Compare les deux côtés avant de dire oui.')}</p>
          <div className="v swap"><img src={IMG('me/me01/161')} alt="" loading="lazy" /><b>⇄</b><img src={IMG('sv/sv10/214')} alt="" loading="lazy" /></div>
        </article>
        <article>
          <h2>{t('Garde scellé')}</h2>
          <p>{t('Suis tes boosters, displays et coffrets à côté de tes cartes.')}</p>
          <div className="v sealed"><SealedArt kind="display" color="#3DC8FF" label="" size={108} /><SealedArt kind="booster" color="#FF3D6E" label="" size={70} /></div>
        </article>
      </section>

      <section className="ld-games" aria-label={t('Les jeux')}>
        <ul>{GAMES.map(g => <li key={g.id}>{g.name}</li>)}</ul>
      </section>

      <section className="ld-end">
        <h2>{t("Ta première page de classeur t'attend.")}</h2>
        <button className="btn primary lg" onClick={open}>{t('Ouvrir mon classeur')}</button>
        <Link to="/compte" onClick={markSeen}>{t("J'ai déjà un compte")}</Link>
        <p>{t('Pas de faux prix : quand on n’en a pas de fiable, on te le dit.')}</p>
        <p className="fine">{t("Images des cartes : leurs éditeurs (The Pokémon Company, Disney, Konami, Panini, Topps…). Photos des vignettes : laststicker.com. Cardora n'est lié à aucun d'eux.")}</p>
        <div className="ld-maker">
          <span>{t('Un projet de')}</span>
          <img src="/brand/brilva-labs-blanc.png" alt="BRILVA Labs" width={132} height={79} loading="lazy" />
        </div>
      </section>
    </div>
  )
}
