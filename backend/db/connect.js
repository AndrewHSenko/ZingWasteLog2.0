const mongoose = require('mongoose')

const connectDB = (url) => {
  return mongoose.connect(url, { dbName: 'WasteLog' }) // set here so every environment uses the same database
}

module.exports = connectDB