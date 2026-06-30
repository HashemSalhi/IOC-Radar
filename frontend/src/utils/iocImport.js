// Extract indicators from a pasted/imported CSV or TXT file.
//
// Files vary: one IOC per line, comma/semicolon/tab separated columns, quoted
// values, header rows, and trailing junk (dates, counts, free text). We split
// on common delimiters and keep only tokens that look like an indicator, so
// CSV headers and non-IOC columns are dropped automatically.

// Broad "does this look like an IOC?" patterns. Mirrors the backend detector
// loosely; defanged forms are normalized first so they pass too.
const IOC_PATTERNS = [
  /^[a-f0-9]{32}$/i,                                   // md5
  /^[a-f0-9]{40}$/i,                                   // sha1
  /^[a-f0-9]{64}$/i,                                   // sha256
  /^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/,           // ip / cidr
  /^[a-z][a-z0-9+.-]*:\/\//i,                          // url (has a scheme)
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i,                      // email
  /^cve-\d{4}-\d{4,7}$/i,                              // cve
  /^as[n]?\d{1,10}$/i,                                 // asn
  /^0x[a-f0-9]{40}$/i,                                 // eth
  /^(bc1|[13])[a-z0-9]{25,62}$/i,                       // btc
  /^(?=.{4,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/i,          // domain
]

// Lightweight refang so defanged indicators in a report are recognized.
function softRefang(token) {
  return token
    .replace(/\[?\(?\.\)?\]?|\[dot\]|\(dot\)/gi, (m) => (/dot|\./i.test(m) ? '.' : m))
    .replace(/\[\.\]|\(\.\)/g, '.')
    .replace(/\[at\]|\(at\)/gi, '@')
    .replace(/h(xx|XX)p/g, 'http')
    .replace(/\[:\/\/\]|\[\/\/\]/g, '://')
}

function looksLikeIoc(token) {
  const t = softRefang(token)
  return IOC_PATTERNS.some((re) => re.test(t))
}

// Returns { iocs: string[], scanned: number, kept: number } where `scanned`
// is the number of candidate tokens seen and `kept` the IOC-looking subset.
export function extractIocs(text) {
  if (!text) return { iocs: [], scanned: 0, kept: 0 }

  // Split on newlines, commas, semicolons, tabs, and surrounding quotes/spaces.
  const tokens = text
    .split(/[\n\r,;\t]+/)
    .map((s) => s.trim().replace(/^["']+|["']+$/g, '').trim())
    .filter(Boolean)

  const seen = new Set()
  const iocs = []
  for (const tok of tokens) {
    if (!looksLikeIoc(tok)) continue
    const key = tok.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    iocs.push(tok)
  }
  return { iocs, scanned: tokens.length, kept: iocs.length }
}
