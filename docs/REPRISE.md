# Cardora — reprise (22/11/2026)

## Le projet
Cardora = appli web (site installable sur téléphone) pour collectionneurs de cartes TCG.
Concurrent à battre : MonPrice (avis lus : abonnement 6–7 €/semaine, prix faux, cartes FR/JP mal gérées,
pas de prix gradés, collections bloquées, tout perdu en changeant de téléphone).
Promesse : « Cardora te dit combien coûte la fin de ta collection, et quelles cartes valent le coup d'être gradées. »
Honnêteté : prix en euros avec la source, jamais de prix inventé.

## Où c'est
- Dossier : `~/Downloads/cardora` (React 19 + Vite + TypeScript + react-router). Git local, branche main, pas encore de dépôt GitHub.
- Conception : `docs/conception.md`.
- Lancer en local : config « cardora » (port 5191) dans `~/Downloads/saas-etudiant/.claude/launch.json`, ou `npm run dev`.
- Vérifier les types : `npx tsc -p tsconfig.app.json --noEmit`.

## Style (refait le 21/11, commit 5f39d7d)
- Polices locales : Bricolage Grotesque (titres, montants) + Figtree (texte), via @fontsource.
- Un seul effet fort : le reflet holo `--foil` (violet #8B6CFF → rose #F472B6 → cyan #67E8F9 → lavande), réservé au logo, aux gros montants, à la progression et au bouton principal.
- Logo : deux cartes en éventail (`src/components/Brand.tsx`). Montants qui défilent (`CountUp`).
- Ordinateur : barre latérale avec valeur de la collection + compte. Téléphone : barre flottante 3 onglets + bouton holo « + ».
- Classeur en double page sur ordinateur, glisser au doigt sur téléphone. Extensions en tuiles avec logo.

## Choix faits avec l'utilisateur
- Téléphone d'abord (site installable / PWA). Ordinateur = consultation (voir tout, sans scanner ni ajouter) une fois les comptes faits.
- Couleurs : noir + violet, **pas d'or**. Fond #0D0B14, cartes #1A1626, violet #7C5CFF, lavande #C4B5FD, vert #4ADE80, rose-rouge #FB7185.
- L'utilisateur veut du beau, de l'interactif et du clair. Il est débutant : lui parler en français simple.

## Ce qui est fait (commits d421619 puis 055233c)
- 5 jeux, sources gratuites :
  - Pokémon en français : api.tcgdex.net, prix Cardmarket €.
  - Yu-Gi-Oh! en français : YGOPRODeck, prix Cardmarket €.
  - Magic : Scryfall, €.
  - One Piece : optcgapi.com, $ (images marquées « SAMPLE »).
  - Lorcana : api.lorcast.com, $.
  - Les dollars sont convertis ×0,92 pour les totaux.
- Foot et F1 sont marqués « bientôt » (pas de source de prix gratuite).
- Classeur de 9 cartes par page (manquantes en gris), mode « Cocher mes cartes », filtres.
- « Combien pour finir ? » : total, cartes les moins chères à acheter, cartes les plus chères qui manquent, barre « tu as / reste ».
- Fiche carte : carte holo 3D, courbe de prix (moyennes 30 j, 7 j, 1 j, aujourd'hui), « Ça vaut le coup de grader ? » (PCA, CollectAura, PSA, seuil de rentabilité, lien vers les ventes eBay, calcul du gain).
- Accueil : écran de bienvenue (cartes en éventail, 3 étapes), puis valeur de la collection, donut par jeu, anneaux de progression, top 5 des cartes.
- Recherche par nom (tous les jeux sauf One Piece). Confettis quand un classeur est complet. Boutons « ? » d'explication.
- Collection gardée dans le navigateur (localStorage, clé `cardora-collection-v1`).

## Investissement + objets scellés (22/11)
- Nouvel onglet **Investir** (`/investir`, `src/pages/Invest.tsx`) : valeur totale (cartes + scellé), plus-value par rapport au prix payé, courbe jour par jour (30 j / 3 mois / tout), part cartes / scellé, « Ce qui bouge » (prix du jour vs moyenne 30 j), meilleures affaires.
- **Prix d'achat** d'une carte : encadré « J'ai payé » sur la fiche carte (champ `buy` dans la collection).
- **Objets scellés** (booster, display, ETB, coffret, tin, deck) : ajout dans une fenêtre, extension cherchée dans la liste du jeu (logo repris). Prix saisis par la personne (pas de source gratuite), bouton « Voir les prix sur Cardmarket », alerte « Prix à revérifier » après 30 jours. Sans prix du jour, on compte le prix payé.
- Visuels : les produits scellés sont **dessinés en CSS** aux couleurs du jeu avec le logo de l'extension (`src/components/Sealed.tsx`, styles `src/invest.css`). Les extensions sans logo montrent un petit booster + le code.
- Historique : une ligne par jour (`history`), notée quand on ouvre l'appli. Tout est dans le même JSON que la collection : **pas de SQL à lancer**. La fusion (`merge.ts`) réunit scellé et historique (test mis à jour).

## Publication
- **En ligne : https://cardora-ecru.vercel.app** (depuis le 20/11, vérifié).
- Code sur GitHub : `helloNovalabs/cardora` (privé), clé d'accès `~/.ssh/cardora_deploy` (réglée dans `core.sshCommand`).
- Projet Vercel « cardora » (équipe julian-a0ff) relié au dépôt : **chaque `git push` sur main publie le site**, sans code 2FA.
- La CLI Vercel reste déconnectée (code 2FA de l'appli d'authentification introuvable) : ne pas s'en servir, passer par git push.

## Comptes (21/11)
- Supabase sur un **nouveau compte** de l'utilisateur : organisation Cardora, projet `cardora` (rjnodshmmhdkfskmqwbf, Irlande). Clé publishable dans `src/lib/supabase.ts`.
- Table `collections` (une ligne JSON par personne, RLS) : `supabase/001_collections.sql` (déjà exécuté).
- Site URL + redirection `https://cardora-ecru.vercel.app/**` réglés.
- Sans SMTP perso, Supabase envoie un **lien** (pas de code) et seulement ~2 e-mails/heure. La page « Mon compte » gère lien et code.
- **22/11 : code à 6 chiffres + suppression de compte codés.** Page « Mon compte » : « Recevoir mon code », puis on tape le code (le lien marche encore en secours). Bouton « Supprimer mon compte » (2 étapes, option pour effacer aussi l'appareil) qui appelle la fonction SQL `delete_my_account` : `supabase/002_supprimer_compte.sql` exécuté le 22/11 (vérifié).
- Réglages Supabase pour le code (FAITS le 22/11, vérifiés) : SMTP Brevo (hôte smtp-relay.brevo.com, port 587, identifiant SMTP Brevo xxx@smtp-brevo.com, mot de passe = clé SMTP collée par l'utilisateur lui-même), expéditeur vérifié dans Brevo, nom « Cardora » ; modèles « Confirm signup » et « Magic link » = contenu de `docs/a-coller/email-code.html` (contient `{{ .Token }}`) ; limite d'e-mails mise à 100/heure (Brevo gratuit = 300/jour, partagés avec Luxie et Nuro). Expéditeur : Cardora, clé SMTP Brevo « Cardora ». Reste : vrai test sur téléphone.
- Fusion à la connexion : `src/lib/merge.ts` (test : `node --experimental-strip-types scripts/merge.test.ts`). Synchro : `src/lib/sync.ts`.

## À faire ensuite
1. ~~Publication durable~~ : fait (cardora-ecru.vercel.app).
2. ~~Comptes~~ : faits le 21/11 (voir « Comptes » plus haut). Code, suppression et réglages Supabase/Brevo faits le 22/11 ; reste un vrai test sur téléphone.
3. Scanner par la caméra (IA : coût par scan à prévoir).
4. Vrais prix gradés (source payante, par ex. PriceCharting).
5. Échanges entre potes (« Lucas a 3 cartes qu'il te manque »).
6. Stocker nous-mêmes les images Yu-Gi-Oh! (YGOPRODeck interdit de les charger directement chez eux) et trouver des images One Piece sans « SAMPLE ».
7. Cartes de foot et de F1.
8. Plus tard : prix automatiques du scellé (source payante, ex. PriceCharting ou Cardmarket API pro).


## 22/11 : 32 jeux, foot, F1, gradation (commit fe6422a)
- Jeux en plus via TCGCSV (données TCGplayer, mises à jour chaque jour) : src/lib/tcg.ts. Le site passe par /tcg/… (vercel.json et vite.config.ts renvoient vers tcgcsv.com). Liste des jeux et numéros de catégorie : src/lib/games.ts.
- Foot (Panini Coupe du monde 2026 + mise à jour) et F1 (Topps Chrome 2025) : listes dans src/data, cartes dessinées (src/components/CardFace.tsx). Pas de prix automatique : la personne note le prix, avec des liens eBay.
- Classeurs : toutes les extensions, rangées par série ou année, « À venir » signalé, tri.
- Extension : tri, filtre rareté, produits scellés avec photo et prix (bouton Ajouter → Investissement, prix mis à jour tout seul une fois par jour).
- Carte : gradation (société + note + valeur), affichée dans un boîtier ; la valeur gradée remplace le prix brut dans les totaux.
- À faire : ajouter d'autres albums de foot (Ligue 1, Champions League) et d'autres séries F1 quand les listes officielles sont trouvées.

## 22/11 (soir) : photos, présentation, scanner, boutique (commits 3b5ec5f → 9235ca1 + correctif)
- Foot / F1 : vraies photos des vignettes `https://www.laststicker.com/i/cards/{album}/{n}.jpg` (`sportPhoto` dans `src/lib/sport.ts`, table `LS` des numéros d'album). Coupe du monde : numéro en minuscules sans espace (`mex1`). Si la photo manque : le dessin (`SportFace` dans `CardFace.tsx`). Couverture d'album = `logo` du set. Crédit affiché dans le classeur.
- Extensions sans logo : `SetCover` cherche le booster (sinon la boîte, sinon une belle carte) dans TCGCSV quand la tuile s'affiche, 3 à la fois, et le garde (`cardora-covers` dans le stockage). Yu-Gi-Oh! : `set_image` de YGOPRODeck.
- Présentation : `/decouvrir` (`src/pages/Landing.tsx`, `src/landing.css`), hors du cadre de l'appli. Montrée une fois quand la collection est vide (`src/lib/seen.ts`). Lien « Revoir la présentation » sur l'accueil vide.
- Scanner : page Ajouter, « Prendre une photo » → `src/lib/scan.ts` (Tesseract.js chargé à la demande, lit sur l'appareil ; l'outil et les langues sont téléchargés depuis jsdelivr). Cherche les noms lus un par un, met en premier la carte au bon numéro. Jeux : Pokémon, Yu-Gi-Oh!, Lorcana, Magic.
- Boutique : `/boutique` (`src/pages/Shop.tsx`), 5e onglet. 6 dernières extensions par ordre d'ajout TCGplayer (pas par date : de vieilles extensions ont des dates changées), produits scellés avec photo, prix TCGplayer en €, liens Cardmarket + TCGplayer, « Je l'ai » → scellé. Cardora ne vend rien.
- Reste possible : scanner en direct (vidéo), affiliation Cardmarket/TCGplayer si l'utilisateur le veut, test réel sur téléphone.

## 23/11 : style « Holo noir »
L'utilisateur trouvait l'ancien look (violet, dégradés) « enfantin » et « comme tous les SaaS ». 3 styles montrés (La Dalle, Holo noir, Rouge enchères) ; pas de préférence, Holo noir choisi.
- `src/theme.css` chargé en dernier : noir #000, blanc, gris #8C8C92 ; couleur seulement dans le reflet holo `--holo` (#FF3D6E, #FFD23D, #3DFF9C, #3DC8FF, #A23DFF).
- Titres et chiffres : Anton en capitales ; texte : Hanken Grotesk. Boutons pilules ; principal blanc avec anneau holo animé (bordure `padding-box`/`border-box`, pas de pseudo-élément : il passait devant).
- Demande en attente : « les différentes langues, un truc stylé » (à préciser : langue de l'appli ou langue des cartes FR/EN/JP).

## 23/11 : langues et recherche en boutique
- Boutique : chercher n'importe quelle carte (photo, prix, liens Cardmarket, TCGplayer, eBay).
- Chaque carte a sa langue (FR, EN, JP, DE, ES, IT, PT, KO, ZH) : `src/components/Lang.tsx`.
- Appli en FR, EN, ES : `src/lib/i18n.ts`. Le texte français sert de clé ; traductions dans `src/i18n/en.ts` et `es.ts`. Tout nouveau texte passe par `t()` / `tr()` et s'ajoute aux deux fichiers.
- Le prix affiché reste « toutes langues » : pas de prix par langue, pour ne pas inventer.

## 23/11 (suite) : marché, Pokémon unique, langue simple
- Concurrents regardés : Collectr, PokeDATA, TCGinvest, ZebraDex, BoostaCote, CollectHolo.
- Pokémon = un seul jeu ; la langue se choisit sur sa page (`src/lib/pokeLang.ts`). Le japonais reste `pokemonjp` en coulisses (`PICK_GAMES` le cache).
- Un seul composant de langue : `src/components/LangMenu.tsx`. Langue de l'appli : page Mon compte (et accueil de présentation).
- Marché (`/boutique`) : hausses, baisses, plus chères, par budget (`src/lib/market.ts`, 48 cartes rares des 16 dernières extensions, vrais prix Cardmarket).
- Investir : envies + prix cible, « Cet échange est juste ? », répartition, export Excel (`src/components/InvestTools.tsx`).
- Éventails d'extensions : adresses d'images déduites, sans appel API (trop d'appels = blocage TCGdex).
- Idées suivantes : outil de centrage, historique long des prix (il faudrait enregistrer les prix chaque jour côté serveur).


## 23/11 : accueil et présentation redessinés
- `/decouvrir` : mur de vraies cartes (`CardWall`), bandeau des prix, classeur d'essai avec vrais prix Cardmarket, classement de ce qui monte, outils, jeux.
- Accueil : grande valeur + 3 plus belles cartes en éventail, classeurs avec leurs cartes. Accueil vide : recherche directe (`/ajouter?q=`).
- Fiche d'une carte redessinée : grande carte, nom et prix géants, onglets Prix / Acheter / Ma carte / Grader.
- Page noire évitée : une erreur 404 reçue pendant une publication restait gardée un an par le navigateur. `index.html` et `public/sw.js` redemandent maintenant le fichier au serveur. Les adresses avec un point (`sv03.5`) marchent en lien direct.

## 28/11 : logo BRILVA Labs + concurrents + import
- Logo BRILVA Labs « Un projet de » tout en bas de la présentation et de l'accueil (sans lien : l'utilisateur ne veut pas de page Mentions légales).
- `docs/concurrents.md` : ~45 applis et sites (investir + enregistrer ses cartes) et les idées qui manquent.
- Import d'une collection (page Ajouter, `src/lib/importCsv.ts`, `src/components/ImportBox.tsx`) : CSV de Collectr, Dex, Dragon Shield, TCGplayer ou tableur ; colonnes reconnues par leur nom ; Pokémon cherché par nom + numéro (TCGdex en/fr, `name=eq:` puis contient), Magic/Yu-Gi-Oh!/Lorcana par la recherche + numéro ; une carte n'est ajoutée que si le numéro correspond ; les lignes non trouvées sont listées. Prix payé et gradation repris tels quels.
- Suite proposée : alertes e-mail au prix cible, historique long des prix côté serveur, outil de centrage.

## 28/11 : alertes prix cible
- Accueil : bandeau holo « X est à ton prix » quand une envie passe sous son prix cible (prix revérifiés une fois par visite, `WishAlert` dans `InvestTools.tsx`).
- Investir > Mes envies : case « Me prévenir par e-mail » (il faut un compte ; réglage `alerts.email` dans la collection, gardé par `merge.ts`).
- Serveur `api/alerts.ts` (fonction Vercel), lancé chaque matin à 7 h UTC (`crons` dans vercel.json ; `api/` exclu de la redirection vers index.html). Prix : Pokémon TCGdex, Magic Scryfall, Yu-Gi-Oh! YGOPRODeck, Lorcana Lorcast. Un seul e-mail par personne, via l'API Brevo. Table `alert_sent` (`supabase/003_alertes.sql`) : pas deux fois la même alerte ; si le prix remonte, la ligne est effacée.
- Réglages à faire par l'utilisateur (sinon le serveur répond « Réglages manquants », rien n'est envoyé) : lancer 003_alertes.sql ; dans Vercel : SUPABASE_SECRET_KEY, BREVO_API_KEY, ALERT_FROM (expéditeur vérifié Brevo), CRON_SECRET ; puis redéployer. Test : Vercel > Settings > Cron Jobs > Run.
