-- Cardora : alertes « prix cible atteint » déjà envoyées (28/11/2026)
-- Une ligne par carte et par prix cible : on n'envoie pas deux fois la même alerte.
-- Seul le serveur (clé secrète) lit et écrit ici : RLS activé et aucune règle pour les visiteurs.
create table if not exists public.alert_sent (
  user_id uuid not null references auth.users on delete cascade,
  card_key text not null,
  target numeric not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, card_key, target)
);
alter table public.alert_sent enable row level security;
