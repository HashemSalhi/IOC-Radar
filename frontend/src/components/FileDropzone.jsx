import { useRef, useState } from 'react'

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileDropzone({ onFilesSelected }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])

  function handleFiles(files) {
    const arr = Array.from(files)
    setSelectedFiles(arr)
    onFilesSelected?.(arr)
  }

  return (
    <div className="space-y-3">
      {/* Drop target */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${dragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-[#1e2d4a] hover:border-cyan-700 hover:bg-slate-800/20'
          }`}
      >
        <div className="text-3xl mb-2 text-slate-600">⬆</div>
        <p className="text-sm text-slate-400">
          Drag & drop files here, or <span className="text-cyan-400">click to browse</span>
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Files are hashed locally — only SHA256 is sent to providers
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-1">
          {selectedFiles.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-slate-800/40 border border-[#1e2d4a] rounded px-3 py-2 text-xs font-mono"
            >
              <span className="text-slate-300 truncate max-w-xs">{f.name}</span>
              <span className="text-slate-500 shrink-0 ml-2">{fmtSize(f.size)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
