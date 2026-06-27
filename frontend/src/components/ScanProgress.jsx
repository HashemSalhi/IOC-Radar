export default function ScanProgress({ total, completed, current }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="bg-[#0f172a] border border-[#1e2d4a] rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-xs text-slate-400 font-mono">
        <span>SCANNING</span>
        <span>{completed}/{total} · {pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {current && (
        <div className="text-[11px] text-slate-500 font-mono truncate">
          ▶ {current}
        </div>
      )}
    </div>
  )
}
