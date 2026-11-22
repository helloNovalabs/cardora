import { useSyncExternalStore } from 'react'
// Supabase est chargé à part, après l'affichage de la page (il pèse lourd).
const sb = () => import('./supabase').then(m => m.supabase)
import { getState, replaceState, setOnLocalChange, type State } from './store'
import { mergeStates } from './merge'

export type SyncStatus = 'off' | 'sync' | 'ok' | 'error'
interface Account { email: string | null; status: SyncStatus; savedAt: number | null }

let account: Account = { email: null, status: 'off', savedAt: null }
let userId: string | null = null
let timer: number | undefined
const subs = new Set<() => void>()
const set = (a: Partial<Account>) => { account = { ...account, ...a }; subs.forEach(f => f()) }

export const useAccount = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f) }, () => account)

async function push() {
  if (!userId) return
  set({ status: 'sync' })
  const { error } = await (await sb()).from('collections').upsert({ user_id: userId, data: getState(), updated_at: new Date().toISOString() })
  set(error ? { status: 'error' } : { status: 'ok', savedAt: Date.now() })
}

/** Enregistre dans le compte un peu plus tard (regroupe plusieurs clics d'affilée). */
function pushSoon() {
  window.clearTimeout(timer)
  timer = window.setTimeout(push, 800)
}

/** À la connexion : on réunit la collection de l'appareil et celle du compte, puis on enregistre. */
async function pull() {
  if (!userId) return
  set({ status: 'sync' })
  const { data, error } = await (await sb()).from('collections').select('data').eq('user_id', userId).maybeSingle()
  if (error) { set({ status: 'error' }); return }
  const cloud = (data?.data as State | undefined) ?? { owned: {}, followed: [] }
  replaceState(mergeStates(getState(), cloud))
  await push()
}

let started = false
export function startSync() {
  if (started) return
  started = true
  setOnLocalChange(() => { if (userId) pushSoon() })
  sb().then(supabase => supabase.auth.onAuthStateChange((_e, session) => {
    const id = session?.user.id ?? null
    if (id === userId) return
    userId = id
    set({ email: session?.user.email ?? null, status: id ? 'sync' : 'off' })
    // on sort du rappel avant d'appeler la base (recommandé par Supabase)
    if (id) window.setTimeout(pull, 0)
  })).catch(() => {})
  // Rattrape un enregistrement raté quand on revient sur l'appli
  window.addEventListener('focus', () => { if (userId && account.status === 'error') push() })
}

export async function sendCode(email: string) {
  const { error } = await (await sb()).auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/compte' } })
  return error ? frError(error.message) : null
}
export async function verifyCode(email: string, token: string) {
  const { error } = await (await sb()).auth.verifyOtp({ email, token, type: 'email' })
  return error ? frError(error.message) : null
}
/** Supprime le compte et sa collection en ligne (fonction SQL 002). Renvoie un message d'erreur ou null. */
export async function deleteAccount() {
  window.clearTimeout(timer)
  const { error } = await (await sb()).rpc('delete_my_account')
  if (error) return 'La suppression n’a pas marché. Vérifie ta connexion internet et réessaie.'
  await (await sb()).auth.signOut({ scope: 'local' })
  return null
}
export async function signOut() {
  window.clearTimeout(timer)
  await (await sb()).auth.signOut()
}

function frError(m: string) {
  const s = m.toLowerCase()
  if (s.includes('rate') || s.includes('seconds')) return 'Trop de demandes d’un coup. Attends une minute puis réessaie.'
  if (s.includes('expired') || s.includes('invalid')) return 'Ce code ne marche pas ou a expiré. Redemande un code.'
  if (s.includes('email')) return 'Cette adresse e-mail ne semble pas valide.'
  return 'Ça n’a pas marché. Vérifie ta connexion internet et réessaie.'
}
