const app = require('../backend/app')
const connectDB = require('../backend/db/connect')

// vercel.json rewrites /api/(.*) here as /api?__vpath=$1. Whether Vercel hands the
// function the original path or the rewritten one is not something to bet a deploy
// cycle on, so rebuild it from __vpath when it is there. The routers are mounted at
// /api/v1/..., and a collapsed req.url would 404 exactly like a missing function.
const restorePath = (req) => {
  const url = new URL(req.url, 'http://localhost')
  const vpath = url.searchParams.get('__vpath')
  if (vpath === null) return // already the real path (local dev, or no rewrite)

  url.searchParams.delete('__vpath')
  const query = url.searchParams.toString()
  req.url = `/api/${vpath}${query ? `?${query}` : ''}`
}

module.exports = async (req, res) => {
  restorePath(req)

  try {
    await connectDB(process.env.MONGO_URI)
  } catch (err) {
    // Never exit the process here — that would kill the whole function instance
    // rather than failing this one request.
    console.error('Database connection failed:', err.message)
    // Plain Node response API — res.status()/res.json() are Vercel helpers that
    // do not exist elsewhere, and reaching for them here crashes the function
    // instead of returning the error.
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Database unavailable' }))
    return
  }

  // An Express app is itself a (req, res) handler.
  return app(req, res)
}
