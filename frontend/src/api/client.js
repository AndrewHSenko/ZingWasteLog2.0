const BASE = '/api/v1'

// The backend has no error-handling middleware yet, so a failed request may come back as an HTML
// stack trace rather than JSON. Pull out a message without assuming the body parses.
const request = async (path, options) => {
  const res = await fetch(BASE + path, options)

  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      // getEntries reports failures as a bare JSON string rather than an object.
      detail = typeof body === 'string' ? body : body.error || body.msg || ''
    } catch {
      detail = ''
    }
    throw new Error(detail || `Request failed (${res.status} ${res.statusText})`)
  }

  if (res.status === 204) return null

  // A deploy without an /api rewrite serves index.html for API paths with a 200,
  // so the !res.ok branch above never fires. Check the type before parsing,
  // otherwise this surfaces as "Unexpected token '<!doctype'".
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      'The API returned HTML instead of JSON — the backend is not reachable at /api.'
    )
  }

  return res.json()
}

const post = (path, body) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const getItems = async () => (await request('/items')).items

export const createItem = async (body) => (await post('/items', body)).item

// Entries are mounted at the /api/v1 root, not /api/v1/entries — see backend/app.js.
export const getEntries = async () => (await request('/')).entries

export const createEntry = async (body) => (await post('/', body)).entry

// Filters map onto the query params backend/controllers/entries.js reads:
// enterer, productName, startEntryDate, endEntryDate. Blank fields are dropped
// so an empty form returns everything.
export const searchEntries = async ({ enterer, productName, startDate, endDate } = {}) => {
  const params = new URLSearchParams()

  if (enterer?.trim()) params.set('enterer', enterer.trim())
  if (productName?.trim()) params.set('productName', productName.trim())

  // A date input yields "YYYY-MM-DD", which the backend turns into UTC midnight.
  // Left bare, an end date excludes everything logged that same day, so pin the
  // bounds to the start and end of the local day.
  if (startDate) params.set('startEntryDate', `${startDate}T00:00:00.000`)
  if (endDate) params.set('endEntryDate', `${endDate}T23:59:59.999`)

  return (await request(`/search?${params}`)).entries
}
