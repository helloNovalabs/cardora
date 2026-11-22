import { APP_LANGS, setAppLang, t, useAppLang, type AppLang } from '../lib/i18n'
import { LangMenu } from './LangMenu'

/** La langue de l'appli. `compact` : seulement « FR » (téléphone). */
export function AppLangPicker({ compact = false }: { compact?: boolean }) {
  const lang = useAppLang()
  return <LangMenu value={lang} short={compact} label={t("Langue de l'appli")} onChange={c => setAppLang(c as AppLang)}
    options={APP_LANGS.map(l => ({ code: l.code, label: l.name, tag: l.tag }))} />
}
