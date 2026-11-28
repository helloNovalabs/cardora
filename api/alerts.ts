/**
 * Cardora : alertes « prix cible atteint », lancées chaque matin par Vercel (voir `crons` dans vercel.json).
 * Pour chaque compte qui a coché « Me prévenir par e-mail », on revérifie le prix des cartes voulues
 * et on envoie UN e-mail avec celles passées sous le prix cible. Chaque alerte n'est envoyée qu'une fois
 * (table alert_sent) ; si le prix remonte au-dessus de la cible, elle pourra repartir plus tard.
 *
 * Réglages à mettre dans Vercel (Settings > Environment Variables), jamais dans le code :
 *   SUPABASE_SECRET_KEY  clé secrète Supabase (Project Settings > API Keys > Secret keys)
 *   BREVO_API_KEY        clé API Brevo (SMTP & API > API Keys)
 *   ALERT_FROM           adresse d'expéditeur vérifiée dans Brevo
 *   CRON_SECRET          un mot de passe au hasard (Vercel l'envoie tout seul au lancement du matin)
 */

export const maxDuration = 60

const SB = 'https://rjnodshmmhdkfskmqwbf.supabase.co'
const SITE = 'https://cardora-ecru.vercel.app'
const USD_TO_EUR = 0.92

type Card = { key: string; game: string; id: string; setId: string; name: string; image: string }
type Wish = { card: Card; target: number | null }
type Data = { wish?: Record<string, Wish>; alerts?: { email?: boolean } }

const n = (v: unknown): number | null => { const x = Number(v); return Number.isFinite(x) && x > 0 ? x : null }

/** Prix du jour en euros, aux mêmes sources que l'appli. `null` si on ne sait pas (jeu non suivi, source en panne). */
export async function priceNow(c: Card): Promise<number | null> {
  const get = async (url: string) => {
    const r = await fetch(url, { headers: { 'User-Agent': 'Cardora/1.0', Accept: 'application/json' } })
    return r.ok ? r.json() : null
  }
  try {
    if (c.game === 'pokemon') {
      const d = await get(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(c.id)}`)
      const cm = d?.pricing?.cardmarket
      return n(cm?.trend) ?? n(cm?.['trend-holo']) ?? n(cm?.avg)
    }
    if (c.game === 'magic') {
      const d = await get(`https://api.scryfall.com/cards/${encodeURIComponent(c.id)}`)
      return n(d?.prices?.eur) ?? n(d?.prices?.eur_foil)
    }
    if (c.game === 'yugioh') {
      const d = await get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(c.id)}`)
      return n(d?.data?.[0]?.card_prices?.[0]?.cardmarket_price)
    }
    if (c.game === 'lorcana') {
      const d = await get(`https://api.lorcast.com/v0/cards/${encodeURIComponent(c.id)}`)
      const usd = n(d?.prices?.usd) ?? n(d?.prices?.usd_foil)
      return usd == null ? null : Math.round(usd * USD_TO_EUR * 100) / 100
    }
  } catch { /* source en panne : on réessaiera demain */ }
  return null
}

const esc = (s: string) => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!)
const eur = (v: number) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const link = (c: Card) => `${SITE}/carte/${c.game}/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.id)}`

export function mailHtml(hits: { card: Card; price: number; target: number }[]) {
  const rows = hits.map(h => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #222">
      <a href="${link(h.card)}" style="color:#fff;text-decoration:none;display:flex;gap:14px;align-items:center">
        ${h.card.image ? `<img src="${esc(h.card.image.replace(/\.webp$/, '.png'))}" width="56" style="border-radius:4px;display:block" alt="">` : ''}
        <span><b style="font-size:16px">${esc(h.card.name)}</b><br>
        <span style="color:#3DFF9C;font-size:15px">${eur(h.price)}</span>
        <span style="color:#8C8C92;font-size:13px"> · ta cible : ${eur(h.target)}</span></span>
      </a></td></tr>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#000;color:#fff;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px">
    <p style="font-size:13px;letter-spacing:.14em;color:#8C8C92;margin:0 0 6px">CARDORA</p>
    <h1 style="font-size:26px;margin:0 0 18px">${hits.length === 1 ? 'Une carte de tes envies est à ton prix' : `${hits.length} cartes de tes envies sont à ton prix`}</h1>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <p style="font-size:13px;color:#8C8C92;margin:18px 0 0">Prix Cardmarket du jour (Lorcana : TCGplayer converti en euros). Ce n'est pas un conseil d'achat : vérifie l'offre avant d'acheter.</p>
    <p style="margin:20px 0"><a href="${SITE}/investir" style="background:#fff;color:#000;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Voir mes envies</a></p>
    <p style="font-size:12px;color:#8C8C92">Tu reçois cet e-mail parce que tu as coché « Me prévenir par e-mail » dans Cardora. Pour arrêter, décoche-le dans Investir &gt; Mes envies.</p>
  </div></body></html>`
}

export async function GET(req: Request) {
  const env = process.env
  const key = env.SUPABASE_SECRET_KEY, brevo = env.BREVO_API_KEY, from = env.ALERT_FROM, cron = env.CRON_SECRET
  if (!key || !brevo || !from || !cron) return Response.json({ error: 'Réglages manquants dans Vercel' }, { status: 500 })
  if (req.headers.get('authorization') !== `Bearer ${cron}`) return Response.json({ error: 'Non autorisé' }, { status: 401 })

  const h: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' }
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`
  const sb = async (path: string, init?: RequestInit) => {
    const r = await fetch(`${SB}${path}`, { ...init, headers: { ...h, ...(init?.headers as Record<string, string>) } })
    if (!r.ok) throw new Error(`Supabase ${r.status} ${await r.text()}`)
    return r.status === 204 ? null : r.json()
  }

  // Les comptes qui ont demandé l'e-mail, leurs adresses, et les alertes déjà envoyées
  const cols = (await sb(`/rest/v1/collections?select=user_id,data&data->alerts->>email=eq.true`)) as { user_id: string; data: Data }[]
  if (!cols.length) return Response.json({ users: 0, sent: 0 })
  const users = (await sb(`/auth/v1/admin/users?per_page=1000`)) as { users: { id: string; email?: string }[] }
  const mailOf = new Map(users.users.map(u => [u.id, u.email]))
  const sentRows = (await sb(`/rest/v1/alert_sent?select=user_id,card_key,target`)) as { user_id: string; card_key: string; target: number }[]
  const sent = new Set(sentRows.map(r => `${r.user_id}|${r.card_key}|${Number(r.target)}`))

  const prices = new Map<string, Promise<number | null>>()
  const price = (c: Card) => { if (!prices.has(c.key)) prices.set(c.key, priceNow(c)); return prices.get(c.key)! }

  let mails = 0
  for (const col of cols) {
    const email = mailOf.get(col.user_id)
    const wishes = Object.values(col.data.wish ?? {}).filter(w => w.target != null && w.card?.key)
    if (!email || !wishes.length) continue
    const hits: { card: Card; price: number; target: number }[] = []
    const back: string[] = []
    for (const w of wishes) {
      const p = await price(w.card)
      if (p == null) continue
      const tag = `${col.user_id}|${w.card.key}|${Number(w.target)}`
      if (p <= w.target!) { if (!sent.has(tag)) hits.push({ card: w.card, price: p, target: w.target! }) }
      else if (sent.has(tag)) back.push(w.card.key) // repassée au-dessus : elle pourra repartir
    }
    for (const k of back) await sb(`/rest/v1/alert_sent?user_id=eq.${col.user_id}&card_key=eq.${encodeURIComponent(k)}`, { method: 'DELETE' })
    if (!hits.length) continue

    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevo, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Cardora', email: from }, to: [{ email }],
        subject: hits.length === 1 ? `${hits[0].card.name} est à ton prix (${eur(hits[0].price)})` : `${hits.length} cartes de tes envies sont à ton prix`,
        htmlContent: mailHtml(hits),
      }),
    })
    if (!r.ok) continue
    mails++
    await sb(`/rest/v1/alert_sent`, {
      method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify(hits.map(x => ({ user_id: col.user_id, card_key: x.card.key, target: x.target }))),
    })
  }
  return Response.json({ users: cols.length, cards: prices.size, sent: mails })
}
