# Cardora — conception (20/11/2026)

## Pourquoi
Faire « MonPrice en mieux ». Les avis de MonPrice (≈180 lus) reprochent : abonnement à la semaine (6–7 €),
prix faux (moyenne US gonflée), cartes FR/JP mal gérées, pas de prix gradés, collections limitées puis
bloquées, tout perdu en changeant de téléphone.

## La signature de Cardora
- **Combien pour finir ?** La collection s'affiche comme un classeur (9 cartes par page). Les cartes
  manquantes sont grisées avec leur prix ; en haut : « Il te manque 78 cartes, ≈ 214 € pour finir ».
- **Ça vaut le coup de la grader ?** Pour une carte brute : prix minimum auquel elle doit se vendre
  gradée pour être rentable, lien vers les ventes eBay, et calcul du gain avec le prix PSA saisi.
- **Honnêteté** : prix en euros avec la source affichée, cartes Pokémon en français, pas de prix inventé.
  Quand on n'a pas de prix fiable, on le dit.
- Plus tard : échanges entre potes (« Lucas a 3 cartes qu'il te manque »).

## Choix (approche 1 retenue)
- Site qui s'installe comme une appli (PWA), pensé téléphone d'abord, React + Vite + TypeScript, Vercel.
- Le téléphone sert à ajouter ses cartes ; l'ordinateur sert à consulter (actif une fois les comptes en place).
- Couleurs : noir violacé #0D0B14, cartes #1A1626, violet #7C5CFF, lavande #C4B5FD, vert #4ADE80, rose-rouge #FB7185. Pas d'or.

## Sources de données (gratuites)
| Jeu | Source | Prix |
|---|---|---|
| Pokémon (FR) | api.tcgdex.net | Cardmarket, EUR |
| Magic | api.scryfall.com | Cardmarket, EUR |
| One Piece | optcgapi.com | TCGplayer, USD (affiché comme tel) |
| Foot, F1, sport | aucune source gratuite | à venir |

## Version 1 (ce qui est construit)
Explorer jeux → extensions → classeur ; fiche carte avec prix et « vaut le coup de grader » ;
ajout / retrait de cartes ; accueil avec valeur totale et progression ; collection gardée sur l'appareil.

## Étapes suivantes
1. Comptes (Supabase) pour retrouver sa collection sur l'ordinateur et ne rien perdre.
2. Scanner par la caméra (reconnaissance d'image par IA : coût à prévoir).
3. Vrais prix gradés (source payante, ex. PriceCharting).
4. Échanges entre potes, cartes de sport.
