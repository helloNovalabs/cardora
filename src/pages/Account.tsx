import { AppLangPicker } from '../components/AppLang'
import { t as tr } from '../lib/i18n'
import { useState } from 'react'
import { deleteAccount, sendCode, signOut, useAccount, verifyCode } from '../lib/sync'
import { replaceState, useCollection } from '../lib/store'

const STATUS = {
  off: '',
  sync: 'Enregistrement en cours…',
  ok: 'Ta collection est à jour sur tous tes appareils ✓',
  error: 'Pas pu enregistrer (pas de réseau ?). Tes cartes restent sur cet appareil, on réessaie au prochain changement.',
}

export default function Account() {
  const acc = useAccount()
  const col = useCollection()
  const nb = Object.values(col.owned).reduce((n, o) => n + o.qty, 0)
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (acc.email) {
    return (
      <div className="stack fade-in" style={{ gap: 16, maxWidth: 540 }}>
        <div className="row between" style={{ gap: 12 }}><h1>{tr('Mon compte')}</h1><AppLangPicker /></div>
        <div className="panel stack">
          <div className="row" style={{ gap: 14 }}>
            <span className="avatar on" style={{ width: 52, height: 52, fontSize: 22 }}>{acc.email[0].toUpperCase()}</span>
            <div className="grow">
              <p className="small muted">{tr('Connecté avec')}</p>
              <p style={{ fontWeight: 700, wordBreak: 'break-all' }}>{acc.email}</p>
            </div>
          </div>
          <p className="small"><b className="num" style={{ fontSize: 22 }}>{nb}</b> carte{nb > 1 ? 's' : ''} dans ta collection</p>
          <p className={'small ' + (acc.status === 'error' ? '' : 'lav')} style={acc.status === 'error' ? { color: '#FB7185' } : undefined}>{tr(STATUS[acc.status])}</p>
        </div>
        <div className="box stack">
          <p className="small muted">{tr('Sur un autre appareil (ordinateur, nouveau téléphone), ouvre Cardora, va dans « Mon compte » et connecte-toi avec la même adresse : tu retrouves tout.')}</p>
        </div>
        <button className="btn" onClick={() => signOut()}>{tr('Se déconnecter')}</button>
        <p className="small muted">{tr('Te déconnecter ne supprime rien : tes cartes restent aussi sur cet appareil.')}</p>
        <DeleteAccount />
      </div>
    )
  }

  const askCode = async () => {
    setBusy(true); setErr(null)
    const e = await sendCode(email.trim())
    setBusy(false)
    if (e) setErr(e); else setStep('code')
  }
  const check = async () => {
    setBusy(true); setErr(null)
    const e = await verifyCode(email.trim(), code.trim())
    setBusy(false)
    if (e) setErr(e)
  }

  return (
    <div className="stack fade-in" style={{ gap: 16, maxWidth: 540 }}>
      <div className="stack" style={{ gap: 6 }}>
        <div className="row between" style={{ gap: 12 }}><h1>{tr('Mon compte')}</h1><AppLangPicker /></div>
        <p className="muted small">
          {tr("Connecte-toi pour retrouver ta collection sur ton ordinateur et ne rien perdre si tu changes de téléphone. Pas de mot de passe : on t'envoie un code à 6 chiffres par e-mail.")}
        </p>
      </div>

      {step === 'email' ? (
        <form className="panel stack" onSubmit={e => { e.preventDefault(); if (email.includes('@')) askCode() }}>
          <label className="small muted" htmlFor="mail">{tr('Ton adresse e-mail')}</label>
          <input id="mail" className="field" type="email" autoComplete="email" inputMode="email" placeholder="toi@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn primary" disabled={busy || !email.includes('@')}>{busy ? tr('Envoi…') : tr('Recevoir mon code')}</button>
          {nb > 0 && <p className="small muted">Les {nb} carte{nb > 1 ? 's' : ''} déjà sur cet appareil seront ajoutées à ton compte.</p>}
        </form>
      ) : (
        <form className="panel stack" onSubmit={e => { e.preventDefault(); if (code.trim().length >= 6) check() }}>
          <p className="small">{tr('Code envoyé à')} <b>{email}</b>. {tr('Tape-le ici :')}</p>
          <input className="field" inputMode="numeric" autoComplete="one-time-code" maxLength={10} placeholder="123456" autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
          <button className="btn primary" disabled={busy || code.length < 6}>{busy ? tr('Vérification…') : tr('Valider le code')}</button>
          <button type="button" className="btn" onClick={() => { setStep('email'); setCode(''); setErr(null) }}>{tr("Changer d'adresse ou renvoyer")}</button>
          <p className="small muted">{tr("Rien reçu après une minute ? Regarde dans les courriers indésirables. Si l'e-mail contient un lien au lieu d'un code, ouvre-le sur cet appareil.")}</p>
        </form>
      )}
      {err && <p className="small" style={{ color: '#FB7185' }}>{tr(err)}</p>}
    </div>
  )
}

/** Supprimer son compte : deux étapes pour éviter un clic par erreur. */
function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [wipe, setWipe] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) return <p className="small lav">{tr('Compte supprimé.')}</p>
  if (!open) {
    return (
      <button type="button" className="btn danger-link" onClick={() => setOpen(true)}>{tr('Supprimer mon compte')}</button>
    )
  }
  const go = async () => {
    setBusy(true); setErr(null)
    const e = await deleteAccount()
    setBusy(false)
    if (e) { setErr(e); return }
    if (wipe) replaceState({ owned: {}, followed: [] })
    setDone(true)
  }
  return (
    <div className="panel stack danger-box" role="alertdialog" aria-labelledby="del-t">
      <h2 id="del-t" style={{ fontSize: 20 }}>{tr('Supprimer ton compte ?')}</h2>
      <p className="small">{tr('Ton compte et la collection enregistrée en ligne sont effacés')} <b>{tr('pour de bon')}</b>. {tr('On ne peut pas les récupérer.')}</p>
      <label className="row small" style={{ gap: 10, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={wipe} onChange={e => setWipe(e.target.checked)} style={{ marginTop: 3 }} />
        <span>{tr('Effacer aussi les cartes gardées sur cet appareil (sinon elles restent ici, sans compte).')}</span>
      </label>
      <button type="button" className="btn danger" disabled={busy} onClick={go}>{busy ? tr('Suppression…') : tr('Oui, supprimer mon compte')}</button>
      <button type="button" className="btn" disabled={busy} onClick={() => { setOpen(false); setErr(null) }}>{tr('Annuler')}</button>
      {err && <p className="small" style={{ color: '#FB7185' }}>{tr(err)}</p>}
    </div>
  )
}
