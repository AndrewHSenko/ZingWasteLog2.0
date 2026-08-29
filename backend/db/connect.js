const mongoose = require('mongoose')

// Serverless invocations reuse the same process when warm, so the connection is
// cached on globalThis. Without this, every request would open a new connection
// and quickly exhaust the Atlas connection limit.
const cache = globalThis._wasteLogMongoose ??= { conn: null, promise: null }

const connectDB = (url) => {
  if (cache.conn) return Promise.resolve(cache.conn)

  if (!cache.promise) {
    cache.promise = mongoose
      // dbName is set here so every environment uses the same database.
      .connect(url, { dbName: 'WasteLog' })
      .then((connected) => {
        cache.conn = connected
        return connected
      })
      .catch((err) => {
        // Drop the rejected promise so the next invocation retries instead of
        // replaying this failure forever.
        cache.promise = null
        throw err
      })
  }

  return cache.promise
}

module.exports = connectDB
