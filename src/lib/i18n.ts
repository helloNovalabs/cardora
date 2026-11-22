import { useSyncExternalStore } from 'react'
import en from '../i18n/en'
import es from '../i18n/es'

/** Langue de l'appli. Le texte français sert de clé : t('Ma collection') → « My collection » en anglais. */
export const APP_LANGS = [
  { code: 'fr', tag: 'FR', name: 'Français' },
  { code: 'en', tag: 'EN', name: 'English' },
  { code: 'es', tag: 'ES', name: 'Español' },
] as const
export type AppLang = (typeof APP_LANGS)[number]['code']

const DICT: Record<string, Record<string, string>> = { en, es }
const KEY = 'cardora-langue'

function first(): AppLang {
  try {
    const s = localStorage.getItem(KEY)
    if (s === 'fr' || s === 'en' || s === 'es') return s
  } catch { /* rien */ }
  const n = (typeof navigator !== 'undefined' ? navigator.language : 'fr').slice(0, 2)
  return n === 'en' || n === 'es' ? n : 'fr'
}
let lang: AppLang = first()
if (typeof document !== 'undefined') document.documentElement.lang = lang
const subs = new Set<() => void>()

export function setAppLang(l: AppLang) {
  lang = l
  try { localStorage.setItem(KEY, l) } catch { /* rien */ }
  document.documentElement.lang = l
  subs.forEach(f => f())
}
export const getAppLang = () => lang
export function useAppLang() {
  return useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f) } }, () => lang)
}

/** Traduit une phrase. Les {mots} entre accolades sont remplacés par les valeurs. */
export function t(s: string, v?: Record<string, string | number>) {
  let r = (lang !== 'fr' && DICT[lang]?.[s]) || s
  if (v) for (const k in v) r = r.split(`{${k}}`).join(String(v[k]))
  return r
}
/** Pluriel simple : t1(n, '{n} carte', '{n} cartes'). */
export const tn = (n: number, one: string, many: string, v?: Record<string, string | number>) => t(n > 1 ? many : one, { n, ...v })
