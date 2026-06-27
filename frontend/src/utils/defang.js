// Defang an indicator so it's safe to paste into tickets/email/chat.
// Inverse of the backend refang(): 8.8.8.8 -> 8[.]8[.]8[.]8, http -> hxxp, :// -> [://]
export function defang(value) {
  if (value == null) return value
  return String(value)
    .replace(/^https?/i, (m) => (m.toLowerCase() === 'https' ? 'hxxps' : 'hxxp'))
    .replace(/:\/\//g, '[://]')
    .replace(/\./g, '[.]')
}

export const maybeDefang = (value, on) => (on ? defang(value) : value)
