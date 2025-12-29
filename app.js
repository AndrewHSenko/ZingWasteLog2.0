require('dotenv').config();
const express = require('express');
const app = express();

const connectDB = require('./db/connect')

const itemsRouter = require('./routes/items')
const entriesRouter = require('./routes/entries')

app.use(express.json())

app.use('/api/v1/items', itemsRouter)
app.use('/api/v1/entries', entriesRouter)

const port = process.env.PORT || 4000; // temporary

const start = async () => {
    try {
      await connectDB(process.env.MONGO_URI)
      app.listen(port, () =>
        console.log(`Server is listening on port ${port}...`)
      );
    } catch (error) {
      console.log(error);
    }
  };
  
  start();