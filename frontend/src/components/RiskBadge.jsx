const BAND_STYLES = {
  High:    'bg-red-950 text-red-400 border border-red-700',
  Medium:  'bg-amber-950 text-amber-400 border border-amber-700',
  Low:     'bg-emerald-950 text-emerald-400 border border-emerald-700',
}

export default function RiskBadge({ band, score }) {
  const style = BAND_STYLES[band] || 'bg-slate-800 text-slate-400 border border-slate-600'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold ${style}`}>
      {band || 'Unknown'}
      {score != null && <span className="opacity-60">({score})</span>}
    </span>
  )
}
