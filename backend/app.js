const express = require('express');
const app = express();

const itemsRouter = require('./routes/items')
const entriesRouter = require('./routes/entries')

app.use(express.json())

app.use('/api/v1/items', itemsRouter)
app.use('/api/v1', entriesRouter)

// Only builds the app. Connecting and listening belong to whatever is running it:
// backend/server.js locally, api/[...path].js on Vercel.
module.exports = app
