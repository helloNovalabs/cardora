# Comptes Cardora — conception (21/11/2026, validée par l'utilisateur)

## Pourquoi
Retrouver la même collection sur téléphone et ordinateur, et ne rien perdre en changeant de téléphone (reproche n°1 fait à MonPrice).

## Ce qu'on fait
- Connexion par **code à 6 chiffres reçu par e-mail** (Supabase Auth, OTP). Pas de mot de passe.
- Compte **facultatif** : sans compte, tout marche comme avant (localStorage).
- **Première connexion** : on fusionne la collection du navigateur avec celle du compte (aucune carte perdue : on garde la plus grande quantité de chaque carte et l'union des classeurs suivis), puis on enregistre.
- Ensuite : chaque changement est enregistré en ligne (un peu retardé pour regrouper les clics). À l'ouverture, on recharge la collection du compte.
- Page **« Mon compte »** (menu + barre du bas) : e-mail → code → connecté ; afficher l'e-mail, état de la synchro, se déconnecter.

## Approches
1. **Une ligne par personne avec toute la collection (JSON)** — retenue : le code garde déjà la collection comme un seul « paquet », c'est simple et suffit (ordinateur surtout en consultation).
2. Une ligne par carte — plus fin mais réécriture du stockage ; inutile pour l'instant.
3. Mettre Cardora dans le Supabase de Luxie — refusée (comptes mélangés, Luxie = mineurs).

## Technique
- Supabase projet `cardora` (rjnodshmmhdkfskmqwbf, nouveau compte de l'utilisateur), clé publishable dans le code (publique par nature).
- Table `collections (user_id uuid pk → auth.users, data jsonb, updated_at)`, RLS : chacun ne lit/écrit que sa ligne.
- Le modèle d'e-mail « Magic Link » doit afficher `{{ .Token }}` pour envoyer un code.

## Hors champ
Google/Discord, Brevo (limite de quelques e-mails/heure acceptée pour les tests), synchro en temps réel, suppression de compte (à ajouter avant ouverture au public).
