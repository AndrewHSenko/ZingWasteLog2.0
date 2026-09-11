// RFC 4180: quote every field and double any embedded quote. Notes are free text and
// may hold commas, quotes, or newlines, so no field is safe to emit bare.
const escapeField = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

// CRLF per RFC 4180 — it is also what keeps a note containing a bare \n from reading
// as a record break to stricter parsers.
export const toCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(escapeField).join(',')).join('\r\n')

export const downloadCsv = (filename, csv) => {
  // The leading BOM is what makes Excel read the file as UTF-8; without it an accented
  // name or note opens as mojibake. Harmless to Sheets and to text parsers. Written as an
  // escape, never a literal: an invisible byte in source is unreadable, easy to delete by
  // accident, and trips eslint's no-irregular-whitespace.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  // Firefox ignores a click on a link that was never in the document.
  document.body.appendChild(link)
  link.click()
  link.remove()

  // The blob is retained until this runs, and the click is synchronous, so releasing
  // it immediately is safe.
  URL.revokeObjectURL(url)
}
