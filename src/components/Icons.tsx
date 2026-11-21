const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }

export const IHome = () => <svg {...P}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" /></svg>
export const IBinder = () => <svg {...P}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 3v18M12 8h5M12 12h5" /></svg>
export const IPlus = () => <svg {...P} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
export const ISearch = () => <svg {...P}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const IBack = () => <svg {...P} width="18" height="18"><path d="m15 18-6-6 6-6" /></svg>
export const IGrade = () => <svg {...P}><rect x="6" y="2.5" width="12" height="19" rx="2" /><path d="M9 6h6M9 18h6" /><path d="m10 12 1.5 1.5L15 10" /></svg>
export const IChevron = () => <svg {...P} width="16" height="16"><path d="m9 18 6-6-6-6" /></svg>
export const IUser = () => <svg {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
