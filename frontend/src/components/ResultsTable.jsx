import { useEffect, useMemo, useRef, useState } from 'react'
import { maybeDefang } from '../utils/defang'
import RiskBadge from './RiskBadge'
import ResultDetailModal from './ResultDetailModal'

const RISK_ORDER = { High: 0, Medium: 1, Low: 2 }

// Pull the first non-empty value for any of `keys` from the result's provider raws.
function fromProviders(r, keys) {
  for (const pr of r.provider_results || []) {
    const raw = pr.raw || {}
    for (const k of keys) {
      if (raw[k] != null && raw[k] !== '') return raw[k]
    }
  }
  return ''
}

function StatusChip({ r }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
      r.status === 'error' ? 'text-red-400 bg-red-950/30' : 'text-emerald-400 bg-emerald-950/30'
    }`}>
      {r.status}
    </span>
  )
}

// Table column registry. `render` draws a custom cell; `value` builds plain text
// (used for both the cell and as a fallback). Enrichment columns read from
// provider results (IPify / AbuseIPDB / VirusTotal / RDAP).
const TABLE_COLUMNS = [
  { key: 'ioc',             label: 'IOC',         sortable: true,  default: true,
    render: r => <span className="truncate block max-w-[260px]" title={r.ioc}>{r.ioc}</span> },
  { key: 'ioc_type',        label: 'Type',        sortable: true,  default: true,  value: r => r.ioc_type?.toUpperCase() || '' },
  { key: 'risk_band',       label: 'Risk',        sortable: true,  default: true,
    render: r => <RiskBadge band={r.risk_band} score={r.risk_score} /> },
  { key: 'detection_ratio', label: 'Detection',   sortable: false, default: true,  value: r => r.detection_ratio || '—' },
  { key: 'source',          label: 'Source',      sortable: false, default: true,  value: r => r.source_filename || '—' },
  { key: 'status',          label: 'Status',      sortable: false, default: true,  render: r => <StatusChip r={r} /> },
  { key: 'country',         label: 'Country',     sortable: false, default: false, value: r => fromProviders(r, ['country', 'country_code']) || '—' },
  { key: 'city',            label: 'City',        sortable: false, default: false, value: r => fromProviders(r, ['city']) || '—' },
  { key: 'isp',             label: 'ISP / Owner', sortable: false, default: false, value: r => fromProviders(r, ['isp', 'as_owner', 'owner']) || '—' },
  { key: 'asn',             label: 'ASN',         sortable: false, default: false, value: r => { const v = fromProviders(r, ['asn']); return v ? `AS${v}` : '—' } },
  { key: 'registrar',       label: 'Registrar',   sortable: false, default: false, value: r => fromProviders(r, ['registrar']) || '—' },
  { key: 'tag',             label: 'Tag',         sortable: false, default: false, value: r => r.tag || '—' },
  { key: 'created_at',      label: 'Scanned',     sortable: false, default: false, value: r => (r.created_at ? new Date(r.created_at).toLocaleString() : '—') },
]

const DEFAULT_COLUMNS = TABLE_COLUMNS.filter(c => c.default).map(c => c.key)

// Exportable fields. `get(r, defangOn)` returns the cell value; enrichment
// fields read from provider results (IPify / AbuseIPDB / VirusTotal / RDAP).
const EXPORT_FIELDS = [
  { key: 'ioc',             label: 'IOC',           default: true,  get: (r, d) => maybeDefang(r.ioc, d) },
  { key: 'ioc_type',        label: 'Type',          default: true,  get: r => r.ioc_type || '' },
  { key: 'risk_band',       label: 'Risk Band',     default: true,  get: r => r.risk_band || '' },
  { key: 'risk_score',      label: 'Risk Score',    default: true,  get: r => r.risk_score ?? '' },
  { key: 'detection_ratio', label: 'Detection',     default: true,  get: r => r.detection_ratio || '' },
  { key: 'status',          label: 'Status',        default: true,  get: r => r.status || '' },
  { key: 'tag',             label: 'Tag',           default: false, get: r => r.tag || '' },
  { key: 'source_filename', label: 'Source File',   default: false, get: r => r.source_filename || '' },
  { key: 'created_at',      label: 'Scanned At',    default: false, get: r => (r.created_at ? new Date(r.created_at).toISOString() : '') },
  { key: 'country',         label: 'Country',       default: false, get: r => fromProviders(r, ['country', 'country_code']) },
  { key: 'city',            label: 'City',          default: false, get: r => fromProviders(r, ['city']) },
  { key: 'isp',             label: 'ISP / Owner',   default: false, get: r => fromProviders(r, ['isp', 'as_owner', 'owner']) },
  { key: 'asn',             label: 'ASN',           default: false, get: r => fromProviders(r, ['asn']) },
  { key: 'registrar',       label: 'Registrar',     default: false, get: r => fromProviders(r, ['registrar']) },
]

const DEFAULT_FIELDS = EXPORT_FIELDS.filter(f => f.default).map(f => f.key)

function download(content, ext, mime) {
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `bulk-ioc-scanner-export-${Date.now()}.${ext}`
  a.click()
}

function csvCell(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function selectedFields(fieldKeys) {
  return EXPORT_FIELDS.filter(f => fieldKeys.includes(f.key))
}

function exportCSV(rows, defangOn, fieldKeys) {
  const fields = selectedFields(fieldKeys)
  const lines = [
    fields.map(f => csvCell(f.label)).join(','),
    ...rows.map(r => fields.map(f => csvCell(f.get(r, defangOn))).join(',')),
  ]
  download(lines.join('\n'), 'csv', 'text/csv')
}

function exportJSON(rows, defangOn, fieldKeys) {
  const fields = selectedFields(fieldKeys)
  const data = rows.map(r => {
    const obj = {}
    for (const f of fields) obj[f.key] = f.get(r, defangOn)
    return obj
  })
  download(JSON.stringify(data, null, 2), 'json', 'application/json')
}

export default function ResultsTable({ results, onTagUpdated, onResultReplaced }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sortKey, setSortKey] = useState('risk_band')
  const [sortDir, setSortDir] = useState('asc')
  const [defangOn, setDefangOn] = useState(false)
  const [selected, setSelected] = useState(null)
  const [exportFields, setExportFields] = useState(DEFAULT_FIELDS)
  const [fieldsOpen, setFieldsOpen] = useState(false)
  const fieldsRef = useRef(null)
  const [visibleCols, setVisibleCols] = useState(DEFAULT_COLUMNS)
  const [colsOpen, setColsOpen] = useState(false)
  const colsRef = useRef(null)

  useEffect(() => {
    if (!fieldsOpen) return
    function onClick(e) {
      if (fieldsRef.current && !fieldsRef.current.contains(e.target)) setFieldsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [fieldsOpen])

  useEffect(() => {
    if (!colsOpen) return
    function onClick(e) {
      if (colsRef.current && !colsRef.current.contains(e.target)) setColsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [colsOpen])

  function toggleField(key) {
    setExportFields(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function toggleCol(key) {
    setVisibleCols(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Render columns in their registry order, limited to the selected ones.
  const shownColumns = useMemo(
    () => TABLE_COLUMNS.filter(c => visibleCols.includes(c.key)),
    [visibleCols],
  )

  const types = useMemo(() => {
    const s = new Set(results.map(r => r.ioc_type).filter(Boolean))
    return ['all', ...s]
  }, [results])

  const filtered = useMemo(() => {
    let rows = [...results]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.ioc.toLowerCase().includes(q))
    }
    if (typeFilter !== 'all') rows = rows.filter(r => r.ioc_type === typeFilter)
    if (riskFilter !== 'all') rows = rows.filter(r => r.risk_band === riskFilter)

    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (sortKey === 'risk_band') {
        av = RISK_ORDER[av] ?? 99
        bv = RISK_ORDER[bv] ?? 99
      }
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [results, search, typeFilter, riskFilter, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleTagUpdated(id, tag) {
    onTagUpdated?.(id, tag)
    // update selected in-place
    if (selected?.id === id) setSelected(prev => ({ ...prev, tag }))
  }

  function handleRescanned(old, updated) {
    setSelected(updated)
    onResultReplaced?.(old, updated)
  }

  if (!results.length) return null

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search IOC..."
            className="bg-slate-900 border border-[#1e2d4a] rounded px-3 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-700 w-52"
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-[#1e2d4a] rounded px-2 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-700"
          >
            {types.map(t => <option key={t} value={t}>{t === 'all' ? 'All types' : t.toUpperCase()}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-slate-900 border border-[#1e2d4a] rounded px-2 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-700"
          >
            <option value="all">All risk</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>{filtered.length}/{results.length} results</span>
          <label className="flex items-center gap-1 cursor-pointer select-none" title="Defang IOCs in exports (8.8.8.8 → 8[.]8[.]8[.]8)">
            <input
              type="checkbox"
              checked={defangOn}
              onChange={e => setDefangOn(e.target.checked)}
              className="accent-cyan-600"
            />
            Defang
          </label>
          <div className="relative" ref={colsRef}>
            <button
              onClick={() => setColsOpen(o => !o)}
              title="Choose which columns to show in the table"
              className="px-3 py-1.5 border border-[#1e2d4a] text-slate-400 hover:text-cyan-400 hover:border-cyan-700 rounded transition-all"
            >
              ▦ Columns ({visibleCols.length}) ▾
            </button>
            {colsOpen && (
              <div className="absolute right-0 mt-1 z-20 w-52 bg-[#0f172a] border border-[#1e2d4a] rounded-lg shadow-xl p-2 max-h-72 overflow-y-auto">
                <div className="flex justify-between px-1 pb-1 mb-1 border-b border-[#1e2d4a] text-[10px] uppercase tracking-widest text-slate-500">
                  <span>Table columns</span>
                  <button
                    onClick={() => setVisibleCols(DEFAULT_COLUMNS)}
                    className="text-cyan-600 hover:text-cyan-400 normal-case tracking-normal"
                  >
                    reset
                  </button>
                </div>
                {TABLE_COLUMNS.map(c => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 px-1 py-1 rounded hover:bg-cyan-950/20 cursor-pointer select-none text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(c.key)}
                      onChange={() => toggleCol(c.key)}
                      className="accent-cyan-600"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={fieldsRef}>
            <button
              onClick={() => setFieldsOpen(o => !o)}
              title="Choose which fields to include in exports"
              className="px-3 py-1.5 border border-[#1e2d4a] text-slate-400 hover:text-cyan-400 hover:border-cyan-700 rounded transition-all"
            >
              ⚙ Fields ({exportFields.length}) ▾
            </button>
            {fieldsOpen && (
              <div className="absolute right-0 mt-1 z-20 w-52 bg-[#0f172a] border border-[#1e2d4a] rounded-lg shadow-xl p-2 max-h-72 overflow-y-auto">
                <div className="flex justify-between px-1 pb-1 mb-1 border-b border-[#1e2d4a] text-[10px] uppercase tracking-widest text-slate-500">
                  <span>Export fields</span>
                  <button
                    onClick={() => setExportFields(DEFAULT_FIELDS)}
                    className="text-cyan-600 hover:text-cyan-400 normal-case tracking-normal"
                  >
                    reset
                  </button>
                </div>
                {EXPORT_FIELDS.map(f => (
                  <label
                    key={f.key}
                    className="flex items-center gap-2 px-1 py-1 rounded hover:bg-cyan-950/20 cursor-pointer select-none text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={exportFields.includes(f.key)}
                      onChange={() => toggleField(f.key)}
                      className="accent-cyan-600"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => exportCSV(filtered, defangOn, exportFields)}
            disabled={!exportFields.length}
            className="px-3 py-1.5 border border-[#1e2d4a] text-slate-400 hover:text-cyan-400 hover:border-cyan-700 rounded transition-all disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-[#1e2d4a]"
          >
            ⬇ CSV
          </button>
          <button
            onClick={() => exportJSON(filtered, defangOn, exportFields)}
            disabled={!exportFields.length}
            className="px-3 py-1.5 border border-[#1e2d4a] text-slate-400 hover:text-cyan-400 hover:border-cyan-700 rounded transition-all disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-[#1e2d4a]"
          >
            ⬇ JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#1e2d4a]">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1e2d4a] bg-slate-900/60">
              {shownColumns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={`text-left px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500
                    ${col.sortable ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-1 text-cyan-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.id ?? i}
                onClick={() => setSelected(r)}
                className="border-b border-[#1e2d4a]/50 hover:bg-cyan-950/10 cursor-pointer transition-colors"
              >
                {shownColumns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                    {col.render ? col.render(r) : col.value(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ResultDetailModal
          key={selected.id}
          result={selected}
          onClose={() => setSelected(null)}
          onTagged={handleTagUpdated}
          onRescanned={handleRescanned}
        />
      )}
    </>
  )
}
