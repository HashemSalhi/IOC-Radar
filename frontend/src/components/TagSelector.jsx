import { useState } from 'react'
import { tagScan } from '../api/client'

const TAGS = ['Malware', 'Phishing', 'Investigation', 'False Positive']

const TAG_COLORS = {
  Malware:         'bg-red-950 text-red-400 border-red-700',
  Phishing:        'bg-orange-950 text-orange-400 border-orange-700',
  Investigation:   'bg-blue-950 text-blue-400 border-blue-700',
  'False Positive': 'bg-slate-800 text-slate-400 border-slate-600',
}

export default function TagSelector({ scanId, currentTag, onTagged }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleTag(tag) {
    const newTag = tag === currentTag ? null : tag  // toggle off
    setSaving(true)
    setError(null)
    try {
      await tagScan(scanId, newTag)
      onTagged?.(newTag)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest">Tag</div>
      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => {
          const active = currentTag === tag
          const cls = TAG_COLORS[tag] || 'bg-slate-800 text-slate-400 border-slate-600'
          return (
            <button
              key={tag}
              onClick={() => handleTag(tag)}
              disabled={saving}
              className={`px-2 py-0.5 rounded border text-xs font-mono transition-all
                ${active ? cls : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {tag}
            </button>
          )
        })}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
