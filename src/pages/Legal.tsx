import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { t } from '../lib/i18n'
import '../landing.css'

/** Mentions légales : hors du cadre de l'appli, comme la présentation. Texte en français (droit français). */
export default function Legal() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div className="ld ld-legal">
      <header className="ld-legal-top">
        <Link to="/decouvrir" aria-label="Cardora"><Brand /></Link>
        <Link to="/decouvrir" className="btn">{t('Retour')}</Link>
      </header>
      <main lang="fr">
        <h1>Mentions légales</h1>

        <h2>Éditeur</h2>
        <p>
          Cardora est un projet de BRILVA Labs. Il est édité par un particulier, à titre non professionnel, qui a choisi de ne pas
          rendre public son nom, comme le permet l'article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l'économie numérique. Son identité a été communiquée à l'hébergeur du site.
        </p>
        <p>Directeur de la publication : l'éditeur.</p>

        <h2>Hébergement du site</h2>
        <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Téléphone : +1 951 383 6898. Site : vercel.com.</p>

        <h2>Stockage des données</h2>
        <p>
          Sans compte, ta collection reste dans ton navigateur, sur ton appareil. Avec un compte, ton adresse e-mail et ta collection
          sont stockées par Supabase Inc., dans un centre de données situé en Europe (Irlande). Tu peux supprimer ton compte et ses
          données à tout moment depuis la page « Mon compte ».
        </p>

        <h2>Prix et images</h2>
        <p>
          Les prix viennent de Cardmarket, TCGplayer et d'autres sources publiques, avec leur source affichée. Ce ne sont pas des
          conseils d'achat ou d'investissement. Les images des cartes appartiennent à leurs éditeurs (The Pokémon Company, Disney,
          Konami, Wizards of the Coast, Bandai, Panini, Topps…) ; les photos des vignettes viennent de laststicker.com. Cardora n'est
          lié à aucun d'eux.
        </p>

        <h2>Propriété</h2>
        <p>
          Le nom Cardora, son logo, ses textes et le code du site appartiennent à son éditeur : ne les copie pas sans accord.
        </p>
      </main>
    </div>
  )
}
