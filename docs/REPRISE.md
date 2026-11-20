# Cardora — reprise (20/11/2026)

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

## Publication
- La CLI Vercel n'est **pas connectée** : l'utilisateur bloque sur le code 2FA (appli d'authentification sur son téléphone).
- Seul lien actuel : publication temporaire anonyme `https://fleet-bronze-t8fztal.tmp.now` (expire 1 h après, vers 15 h 02 le 20/11).
  Republier avec `npx vercel@latest deploy --temporary --yes`.
- Pour un lien durable : `npx vercel@latest login` (code 2FA), puis `vercel deploy --prod`. Ou créer un dépôt GitHub et l'importer dans Vercel.

## À faire ensuite
1. Publication durable sur Vercel (régler le 2FA).
2. Comptes Supabase pour synchroniser téléphone et ordinateur (rien ne se perd).
3. Scanner par la caméra (IA : coût par scan à prévoir).
4. Vrais prix gradés (source payante, par ex. PriceCharting).
5. Échanges entre potes (« Lucas a 3 cartes qu'il te manque »).
6. Stocker nous-mêmes les images Yu-Gi-Oh! (YGOPRODeck interdit de les charger directement chez eux) et trouver des images One Piece sans « SAMPLE ».
7. Cartes de foot et de F1.
