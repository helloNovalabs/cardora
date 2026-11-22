/** La page de présentation n'est montrée qu'une fois, aux nouveaux visiteurs. */
const KEY = 'cardora-decouvert'
export const markSeen = () => { try { localStorage.setItem(KEY, '1') } catch { /* navigation privée */ } }
export const wasSeen = () => { try { return localStorage.getItem(KEY) === '1' } catch { return true } }
