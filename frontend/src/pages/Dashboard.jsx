import { useEffect, useState } from 'react'
import { getHistory, getHistoryStats, getSettings } from '../api/client'

function StatCard({ label, value, color }) {
  return (
    <div className="bg-[#0f172a] border border-[#1e2d4a] rounded-lg p-4 space-y-1">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
      <div className={`text-2xl font-mono font-bold ${color}`}>{value ?? '—'}</div>
    </div>
  )
}

function ProviderDot({ enabled }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [providerStatus, setProviderStatus] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getHistoryStats(), getHistory({ limit: 10 }), getSettings()])
      .then(([s, h, cfg]) => {
        setStats(s)
        setRecent(h.items)
        setProviderStatus(cfg.providers)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-slate-500 font-mono text-sm">Loading…</div>

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img src="/logo.svg" alt="logo" className="w-10 h-10" />
        <div>
          <h1 className="text-2xl font-mono font-bold text-cyan-400 tracking-widest">BULK-IOC-SCANNER</h1>
          <p className="text-xs text-slate-500">Threat Intelligence Scanner · SOC Analyst Tool</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Scans"  value={stats?.total}      color="text-slate-200" />
        <StatCard label="Malicious"    value={stats?.malicious}  color="text-red-400"   />
        <StatCard label="Suspicious"   value={stats?.suspicious} color="text-amber-400" />
        <StatCard label="Clean"        value={stats?.clean}      color="text-emerald-400" />
      </div>

      {/* Provider status */}
      <div className="bg-[#0f172a] border border-[#1e2d4a] rounded-lg p-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Provider Status</div>
        <div className="space-y-2">
          {providerStatus.map(p => (
            <div key={p.name} className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                <ProviderDot enabled={p.enabled} />
                {p.name}
              </span>
              <span className="text-slate-600">
                {p.enabled ? (p.key_hint || 'configured') : 'no API key'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent scans */}
      {recent.length > 0 && (
        <div className="bg-[#0f172a] border border-[#1e2d4a] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e2d4a] text-[10px] text-slate-500 uppercase tracking-widest">
            Recent Scans
          </div>
          <table className="w-full text-xs font-mono">
            <tbody>
              {recent.map(r => (
                <tr key={r.id} className="border-b border-[#1e2d4a]/50">
                  <td className="px-4 py-2.5 text-slate-400 max-w-[200px]">
                    <span className="truncate block" title={r.ioc}>{r.ioc}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.ioc_type?.toUpperCase()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs ${
                      r.risk_band === 'High' ? 'text-red-400' :
                      r.risk_band === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {r.risk_band || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats?.total === 0 && (
        <div className="text-center py-10 text-slate-600 font-mono text-sm">
          No scans yet. <a href="/scan" className="text-cyan-600 hover:text-cyan-400 underline">Run your first scan →</a>
        </div>
      )}
    </div>
  )
}
