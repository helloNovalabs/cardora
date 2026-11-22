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
