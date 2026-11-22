import { t } from '../lib/i18n'
import { useEffect, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { AppLangPicker } from '../components/AppLang'
import { HoloCard } from '../components/Visuals'
import { SealedArt } from '../components/Sealed'
import { GAMES } from '../lib/games'
import { markSeen } from '../lib/seen'
import '../landing.css'


const LS = 'https://www.laststicker.com/i/cards/'
/** La page du classeur de l'accueil : de vraies cartes de jeux différents, et des cases vides. */
const POCKETS: ({ src: string; alt: string; holo?: boolean } | null)[] = [
  { src: 'https://assets.tcgdex.net/fr/sv/sv03.5/199/high.webp', alt: 'Dracaufeu-ex, Pokémon' },
  { src: LS + '11771/247.jpg', alt: 'Aubameyang, Panini Foot Ligue 1' },
  null,
  { src: LS + '11964/1.jpg', alt: 'Max Verstappen, Topps Chrome F1' },
  { src: 'https://cards.lorcast.io/card/digital/large/crd_a6a007b0f7ae4fa19480721bacd2b0b6.avif?1747508548', alt: 'Elsa, Lorcana', holo: true },
  { src: 'https://images.ygoprodeck.com/images/cards/89631139.jpg', alt: 'Dragon Blanc aux Yeux Bleus, Yu-Gi-Oh!' },
  null,
  { src: LS + '12176/fra5.jpg', alt: 'France, Panini Coupe du monde 2026' },
  null,
]
const ROW = ['250', '251', '252', '253', '254', '255', '256', '257'].map((n, i) => ({ src: `${LS}11771/${n}.jpg`, have: [0, 1, 3, 4, 6].includes(i) }))

export default function Landing() {
  const nav = useNavigate()
  useEffect(() => { document.title = t('Cardora : toutes tes cartes, un seul classeur'); return () => { document.title = 'Cardora' } }, [])
  const open = () => { markSeen(); nav('/') }
  const have = POCKETS.filter(Boolean).length

  return (
    <div className="ld">
      <header className="ld-top">
        <Brand />
        <span className="row" style={{ gap: 10 }}><AppLangPicker compact /><button className="btn ghost sm" onClick={open}>{t("Ouvrir l'appli")}</button></span>
      </header>

      <section className="ld-hero">
        <div className="ld-foil" aria-hidden><i /></div>
        <div className="ld-copy">
          <h1>{t('Toutes')}<br /><span>{t('tes cartes.')}</span><br />{t('Une cote.')}</h1>
          <p className="ld-lead">{t("Pokémon, One Piece, Lorcana, Magic, les vignettes Panini ou les cartes de F1 : tu coches ce que tu as, Cardora te montre ce qu'il te manque et ce que vaut ta collection, en euros.")}</p>
          <div className="ld-cta">
            <button className="btn primary lg" onClick={open}>{t('Ouvrir mon classeur')}</button>
            <span className="muted small">{t('Gratuit, sans compte pour commencer.')}</span>
          </div>
        </div>
        <div className="ld-hero-card"><HoloCard src={POCKETS[0]!.src} alt={POCKETS[0]!.alt} /></div>
      </section>

      <section className="ld-feat">
        <div className="ld-text">
          <h2>{t('Un classeur pour tous tes jeux')}</h2>
          <p>{t('Tes cartes Pokémon à côté de tes vignettes de Ligue 1 et de tes cartes de F1. Les cases vides, ce sont celles qui te manquent.')}</p>
        </div>
        <div className="ld-binder" aria-label={t('Exemple de page de classeur')}>
          <div className="ld-page">
            {POCKETS.map((p, i) => (
              <div key={i} className={'ld-pocket' + (p ? '' : ' empty')} style={{ '--i': i } as CSSProperties}>
                {p ? (p.holo ? <HoloCard src={p.src} alt={p.alt} /> : <img src={p.src} alt={p.alt} loading="lazy" referrerPolicy="no-referrer" />) : <span>?</span>}
              </div>
            ))}
          </div>
          <div className="ld-binder-foot">
            <span><b>{have}</b> / {t('{n} cartes', { n: POCKETS.length })}</span>
            <span className="ld-bar"><i style={{ width: `${(have / POCKETS.length) * 100}%` }} /></span>
          </div>
        </div>
      </section>

      <section className="ld-games" aria-label={t('Les jeux')}>
        <p><b>{t('{n} jeux', { n: GAMES.length })}</b> {t('et leurs extensions, rangées par série.')}</p>
        <ul>{GAMES.map(g => <li key={g.id} style={{ '--gc': g.color } as CSSProperties}>{g.name}</li>)}</ul>
      </section>

      <section className="ld-feat">
        <div className="ld-text">
          <h2>{t('Un toucher, la carte est cochée')}</h2>
          <p>{t("Chaque extension a sa page, carte par carte. Celles que tu as sont en couleur, celles qui te manquent restent en gris. Pour le foot et la F1, ce sont les vraies vignettes de l'album.")}</p>
        </div>
        <div className="ld-row" aria-hidden>
          {ROW.map(c => <span key={c.src} className={c.have ? 'have' : ''}><img src={c.src} alt="" loading="lazy" referrerPolicy="no-referrer" /></span>)}
        </div>
      </section>

      <section className="ld-feat flip">
        <div className="ld-text">
          <h2>{t('Combien pour finir ?')}</h2>
          <p>{t('Cardora additionne le prix des cartes qui te manquent, avec les prix du marché (Cardmarket, TCGplayer), et te dit par où commencer.')}</p>
        </div>
        <div className="ld-finish">
          <span className="ld-ex">{t('Exemple')}</span>
          <span className="ld-big">{t('23 cartes')}</span>
          <span className="muted">{t('te manquent dans cette extension')}</span>
          <span className="ld-sum">{t('environ')} <b className="foil-text">41,80 €</b></span>
        </div>
      </section>

      <section className="ld-duo">
        <div>
          <h2>{t('Scanne ta carte')}</h2>
          <p>{t('Prends-la en photo : Cardora lit son nom et son numéro, et te la montre. Un toucher et elle est dans ton classeur.')}</p>
        </div>
        <div>
          <h2>{t('La boutique des sorties')}</h2>
          <p>{t("Les nouveaux boosters, displays et coffrets de chaque jeu, avec le prix du marché et un lien pour l'acheter où tu veux.")}</p>
        </div>
      </section>

      <section className="ld-feat">
        <div className="ld-text">
          <h2>{t('La gradation, et le scellé aussi')}</h2>
          <p>{t('Note la note de ta carte gradée (PSA, CGC, BGS…) et range tes boosters, displays et coffrets à côté de tes cartes. La valeur de tout est suivie jour après jour.')}</p>
        </div>
        <div className="ld-grade">
          <div className="slab">
            <div className="slab-label psa">
              <div style={{ minWidth: 0 }}><div className="co">PSA</div><div className="nm">Dracaufeu-ex · n° 199</div></div>
              <div className="g">10</div>
            </div>
            <img src={POCKETS[0]!.src} alt="" loading="lazy" />
          </div>
          <div className="ld-sealed">
            <SealedArt kind="booster" color="#FF3D6E" label="Booster" size={70} />
            <SealedArt kind="etb" color="#3DC8FF" label={t('Coffret')} size={86} />
          </div>
        </div>
      </section>

      <section className="ld-honest">
        <h2>{t("Ce qu'on te promet, et ce qu'on ne fait pas")}</h2>
        <ul>
          <li><b>{t('Pas de faux prix.')}</b> {t("Quand on n'a pas de prix fiable (le foot, la F1), on te le dit, et c'est toi qui notes.")}</li>
          <li><b>{t('Ta collection reste à toi.')}</b> {t('Elle est gardée sur ton appareil. Avec un compte, tu la retrouves sur ton téléphone et ton ordinateur.')}</li>
          <li><b>{t('Gratuit pour commencer.')}</b> {t('Pas de pub, et pas besoin de carte bancaire.')}</li>
        </ul>
      </section>

      <section className="ld-end">
        <h2>{t("Ta première page de classeur t'attend.")}</h2>
        <button className="btn primary lg" onClick={open}>{t('Ouvrir mon classeur')}</button>
        <p className="muted tiny">{t("Images des cartes : leurs éditeurs (The Pokémon Company, Disney, Konami, Panini, Topps…). Photos des vignettes : laststicker.com. Cardora n'est lié à aucun d'eux.")}</p>
        <Link to="/compte" className="small" onClick={markSeen}>{t("J'ai déjà un compte")}</Link>
      </section>
    </div>
  )
}
