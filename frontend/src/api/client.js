/**
 * IOC-Radar API client.
 * All requests go to /api (proxied to backend in dev, same-origin in prod).
 */

const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {}
    throw new Error(detail)
  }
  return res.json()
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export const scanIOCs = (iocs) =>
  request('/scan', {
    method: 'POST',
    body: JSON.stringify({ iocs }),
  })

export const scanText = (text) =>
  request('/scan/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })

export const scanFiles = async (fileList) => {
  const formData = new FormData()
  for (const file of fileList) {
    formData.append('files', file)
  }
  const res = await fetch(`${BASE}/scan/files`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {}
    throw new Error(detail)
  }
  return res.json()
}

export const tagScan = (scanId, tag) =>
  request(`/scan/${scanId}/tag`, {
    method: 'PATCH',
    body: JSON.stringify({ tag }),
  })

// ── History ───────────────────────────────────────────────────────────────────

export const getHistory = () => request('/history')

export const getHistoryStats = () => request('/history/stats')

export const getScanDetail = (id) => request(`/history/${id}`)

// ── Settings ──────────────────────────────────────────────────────────────────

export const getSettings = () => request('/settings')

export const updateApiKeys = (keys) =>
  request('/settings/keys', {
    method: 'PUT',
    body: JSON.stringify(keys),
  })
