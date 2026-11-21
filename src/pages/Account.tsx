import { useState } from 'react'
import { sendCode, signOut, useAccount, verifyCode } from '../lib/sync'
import { useCollection } from '../lib/store'

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
        <h1>Mon compte</h1>
        <div className="panel stack">
          <div className="row" style={{ gap: 14 }}>
            <span className="avatar on" style={{ width: 52, height: 52, fontSize: 22 }}>{acc.email[0].toUpperCase()}</span>
            <div className="grow">
              <p className="small muted">Connecté avec</p>
              <p style={{ fontWeight: 700, wordBreak: 'break-all' }}>{acc.email}</p>
            </div>
          </div>
          <p className="small"><b className="num" style={{ fontSize: 22 }}>{nb}</b> carte{nb > 1 ? 's' : ''} dans ta collection</p>
          <p className={'small ' + (acc.status === 'error' ? '' : 'lav')} style={acc.status === 'error' ? { color: '#FB7185' } : undefined}>{STATUS[acc.status]}</p>
        </div>
        <div className="box stack">
          <p className="small muted">Sur un autre appareil (ordinateur, nouveau téléphone), ouvre Cardora, va dans « Mon compte » et connecte-toi avec la même adresse : tu retrouves tout.</p>
        </div>
        <button className="btn" onClick={() => signOut()}>Se déconnecter</button>
        <p className="small muted">Te déconnecter ne supprime rien : tes cartes restent aussi sur cet appareil.</p>
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
        <h1>Mon compte</h1>
        <p className="muted small">
          Connecte-toi pour retrouver ta collection sur ton ordinateur et ne rien perdre si tu changes de téléphone. Pas de mot de passe : on t'envoie un e-mail.
        </p>
      </div>

      {step === 'email' ? (
        <form className="panel stack" onSubmit={e => { e.preventDefault(); if (email.includes('@')) askCode() }}>
          <label className="small muted" htmlFor="mail">Ton adresse e-mail</label>
          <input id="mail" className="field" type="email" autoComplete="email" inputMode="email" placeholder="toi@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn primary" disabled={busy || !email.includes('@')}>{busy ? 'Envoi…' : 'Recevoir mon e-mail de connexion'}</button>
          {nb > 0 && <p className="small muted">Les {nb} carte{nb > 1 ? 's' : ''} déjà sur cet appareil seront ajoutées à ton compte.</p>}
        </form>
      ) : (
        <form className="panel stack" onSubmit={e => { e.preventDefault(); if (code.trim().length >= 6) check() }}>
          <p className="small">E-mail envoyé à <b>{email}</b>.</p>
          <p className="small muted">Ouvre-le <b>sur cet appareil</b> et touche le lien : tu seras connecté. S'il contient un code à 6 chiffres, tape-le ici :</p>
          <input className="field" inputMode="numeric" autoComplete="one-time-code" maxLength={10} placeholder="123456" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
          <button className="btn primary" disabled={busy || code.length < 6}>{busy ? 'Vérification…' : 'Valider le code'}</button>
          <button type="button" className="btn" onClick={() => { setStep('email'); setCode(''); setErr(null) }}>Changer d'adresse ou renvoyer</button>
          <p className="small muted">Rien reçu ? Regarde dans les courriers indésirables.</p>
        </form>
      )}
      {err && <p className="small" style={{ color: '#FB7185' }}>{err}</p>}
    </div>
  )
}
