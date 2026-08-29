// Catch-all so every /api/v1/... path reaches the Express app. The app's own
// route mounts already expect the full path, so nothing is rewritten here.
const app = require('../backend/app')
const connectDB = require('../backend/db/connect')

module.exports = async (req, res) => {
  try {
    await connectDB(process.env.MONGO_URI)
  } catch (err) {
    // Never exit the process here — that would kill the whole function instance
    // rather than failing this one request.
    console.error('Database connection failed:', err.message)
    res.status(503).json({ error: 'Database unavailable' })
    return
  }

  // An Express app is itself a (req, res) handler.
  return app(req, res)
}
