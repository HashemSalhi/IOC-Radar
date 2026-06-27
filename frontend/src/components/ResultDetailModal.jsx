import { useState } from 'react'
import CopyReportButton, { buildReport } from './CopyReportButton'
import RiskBadge from './RiskBadge'
import TagSelector from './TagSelector'

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-[#1e2d4a] pb-1">{title}</div>
      {children}
    </div>
  )
}

function KV({ label, value }) {
  if (value == null || value === '' || value === false) return null
  return (
    <div className="flex gap-2 text-xs font-mono">
      <span className="text-slate-500 shrink-0 w-32">{label}</span>
      <span className="text-slate-200 break-all">{String(value)}</span>
    </div>
  )
}

function VendorDetections({ detections }) {
  const entries = Object.entries(detections || {})
  if (!entries.length) return <p className="text-xs text-slate-500 font-mono">No malicious detections</p>
  return (
    <div className="max-h-40 overflow-y-auto space-y-1">
      {entries.map(([engine, info]) => (
        <div key={engine} className="flex gap-2 text-xs font-mono">
          <span className={`shrink-0 ${info.category === 'malicious' ? 'text-red-400' : 'text-amber-400'}`}>
            {info.category === 'malicious' ? '✕' : '△'}
          </span>
          <span className="text-slate-300 w-40 shrink-0 truncate">{engine}</span>
          <span className="text-slate-500 truncate">{info.result || info.category}</span>
        </div>
      ))}
    </div>
  )
}

function ProviderPanel({ pr }) {
  const r = pr.raw || {}
  if (!pr.success) {
    return (
      <div className="bg-red-950/20 border border-red-900/40 rounded p-3 text-xs font-mono text-red-400">
        {pr.error || 'Unknown error'}
      </div>
    )
  }

  const isVT = pr.provider === 'virustotal'
  const isAbuse = pr.provider === 'abuseipdb'

  return (
    <div className="bg-slate-900/50 border border-[#1e2d4a] rounded p-3 space-y-3">
      {isVT && (
        <>
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            <span className="text-red-400">✕ {r.malicious ?? 0} malicious</span>
            <span className="text-amber-400">△ {r.suspicious ?? 0} suspicious</span>
            <span className="text-emerald-400">✓ {r.harmless ?? 0} harmless</span>
            <span className="text-slate-500">? {r.undetected ?? 0} undetected</span>
          </div>
          <KV label="File Name" value={r.file_name} />
          <KV label="File Type" value={r.file_type} />
          <KV label="First Seen" value={r.first_seen} />
          <KV label="Last Analysis" value={r.last_analysis} />
          <KV label="Country" value={r.country} />
          <KV label="ASN" value={r.asn} />
          <KV label="AS Owner" value={r.as_owner} />
          <KV label="Reputation" value={r.reputation} />
          <KV label="Page Title" value={r.title} />
          <KV label="Final URL" value={r.final_url} />
          {r.last_dns_records?.length > 0 && (
            <div className="text-xs font-mono text-slate-400">
              DNS: {r.last_dns_records.slice(0, 5).map(d => `${d.type} ${d.value}`).join(', ')}
            </div>
          )}
          {r.categories && Object.keys(r.categories).length > 0 && (
            <div className="text-xs font-mono text-slate-400">
              Categories: {Object.values(r.categories).join(', ')}
            </div>
          )}
          {r.vendor_detections && (
            <div className="mt-2">
              <div className="text-[10px] text-slate-500 mb-1">Vendor Detections</div>
              <VendorDetections detections={r.vendor_detections} />
            </div>
          )}
        </>
      )}

      {isAbuse && (
        <>
          <KV label="Confidence" value={r.abuse_confidence_score != null ? `${r.abuse_confidence_score}%` : null} />
          <KV label="Country" value={r.country_code} />
          <KV label="ISP" value={r.isp} />
          <KV label="Usage Type" value={r.usage_type} />
          <KV label="Total Reports" value={r.total_reports} />
          <KV label="TOR Node" value={r.is_tor ? 'YES ⚠' : null} />
          <KV label="Whitelisted" value={r.is_whitelisted ? 'Yes' : null} />
          <KV label="Last Reported" value={r.last_reported} />
        </>
      )}
    </div>
  )
}

export default function ResultDetailModal({ result, onClose, onTagged }) {
  const [localTag, setLocalTag] = useState(result?.tag || null)

  if (!result) return null

  function handleTagged(tag) {
    setLocalTag(tag)
    onTagged?.(result.id, tag)
  }

  const report = buildReport({ ...result, tag: localTag })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border-l border-[#1e2d4a] w-full max-w-xl h-full overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a] sticky top-0 bg-[#0f172a]">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">IOC Detail</div>
            <div className="text-cyan-400 font-mono text-sm truncate max-w-xs mt-0.5">{result.ioc}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-5">

          <Section title="Summary">
            <div className="flex flex-wrap gap-3 items-center">
              <RiskBadge band={result.risk_band} score={result.risk_score} />
              <span className="text-xs font-mono text-slate-400 bg-slate-800 border border-[#1e2d4a] px-2 py-0.5 rounded">
                {result.ioc_type?.toUpperCase()}
              </span>
              {result.detection_ratio && (
                <span className="text-xs font-mono text-slate-300">
                  Detection: {result.detection_ratio}
                </span>
              )}
            </div>
            {result.source_filename && (
              <div className="text-xs font-mono text-slate-500">
                📄 {result.source_filename}
                {result.file_size != null && ` (${(result.file_size / 1024).toFixed(1)} KB)`}
              </div>
            )}
            {result.created_at && (
              <div className="text-xs font-mono text-slate-600">
                Scanned: {new Date(result.created_at).toLocaleString()}
              </div>
            )}
          </Section>

          {result.id && (
            <Section title="Tag">
              <TagSelector
                scanId={result.id}
                currentTag={localTag}
                onTagged={handleTagged}
              />
            </Section>
          )}

          {(result.provider_results || []).map((pr) => (
            <Section key={pr.provider} title={pr.provider === 'virustotal' ? 'VirusTotal' : pr.provider === 'abuseipdb' ? 'AbuseIPDB' : pr.provider}>
              <ProviderPanel pr={pr} />
            </Section>
          ))}

          <Section title="Investigation Report">
            <pre className="bg-slate-900 border border-[#1e2d4a] rounded p-3 text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {report}
            </pre>
          </Section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1e2d4a] flex justify-end">
          <CopyReportButton result={{ ...result, tag: localTag }} />
        </div>
      </div>
    </div>
  )
}
