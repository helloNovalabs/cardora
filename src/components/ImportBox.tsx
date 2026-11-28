import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { t as tr } from '../lib/i18n'
import { matchRows, readRows, type Result, type Row } from '../lib/importCsv'
import { importCards } from '../lib/store'

/** « Tu viens d'une autre appli ? » : reprendre sa collection depuis un fichier CSV (Collectr, Dex, Dragon Shield…). */
export function ImportBox() {
  const ref = useRef<HTMLInputElement>(null)
  const [st, setSt] = useState<
    | { step: 'idle' }
    | { step: 'bad' }
    | { step: 'run'; done: number; total: number }
    | { step: 'end'; res: Result; added: number }
  >({ step: 'idle' })

  const onFile = async (f: File) => {
    const rows = readRows(await f.text())
    if (!rows?.length) { setSt({ step: 'bad' }); return }
    setSt({ step: 'run', done: 0, total: rows.length })
    const res = await matchRows(rows, done => setSt({ step: 'run', done, total: rows.length }))
    importCards(res.found)
    setSt({ step: 'end', res, added: res.found.reduce((n, x) => n + x.qty, 0) })
  }

  const label = (r: Row) => [r.name, r.set, r.number && `n° ${r.number}`].filter(Boolean).join(' · ')

  return (
    <div className="box stack import-box" style={{ gap: 8 }}>
      <h3 className="small" style={{ fontWeight: 800 }}>{tr("Tu viens d'une autre appli ?")}</h3>
      {st.step === 'idle' && <p className="tiny muted">{tr('Exporte ta collection en fichier CSV depuis Collectr, Dex, Dragon Shield, TCGplayer ou un tableur, puis choisis-le ici. Cardora retrouve chaque carte par son nom et son numéro.')}</p>}
      {st.step === 'bad' && <p className="tiny down">{tr("Je ne trouve pas de colonne avec le nom des cartes. Choisis un fichier CSV exporté par ton appli.")}</p>}
      {st.step === 'run' && (
        <>
          <p className="tiny muted">{tr('Je retrouve tes cartes… {d} sur {n}', { d: st.done, n: st.total })}</p>
          <span className="bar"><span style={{ width: `${Math.max(4, (st.done / st.total) * 100)}%` }} /></span>
        </>
      )}
      {st.step === 'end' && (
        <>
          <p className="small">
            <b>{tr(st.added === 1 ? '{n} carte ajoutée' : '{n} cartes ajoutées', { n: st.added })}</b>
            {st.res.missing.length > 0 && <> · {tr(st.res.missing.length === 1 ? '{n} ligne non trouvée' : '{n} lignes non trouvées', { n: st.res.missing.length })}</>}
          </p>
          {st.added > 0 && <p className="tiny muted">{tr('Les prix payés et les notes de gradation sont repris tels quels. Vérifie-les sur la fiche de chaque carte.')}</p>}
          {st.res.missing.length > 0 && (
            <details className="tiny">
              <summary>{tr('Voir les cartes à ajouter à la main')}</summary>
              <ul className="import-miss">{st.res.missing.slice(0, 200).map(r => <li key={r.line}>{label(r)}</li>)}</ul>
            </details>
          )}
          {st.added > 0 && <Link to="/" className="btn sm">{tr('Voir ma collection')}</Link>}
        </>
      )}
      <div className="row wrap" style={{ gap: 8 }}>
        <button className="btn sm" disabled={st.step === 'run'} onClick={() => ref.current?.click()}>
          {st.step === 'end' ? tr('Importer un autre fichier') : tr('Choisir mon fichier CSV')}
        </button>
      </div>
      <input ref={ref} type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onFile(f) }} />
    </div>
  )
}
