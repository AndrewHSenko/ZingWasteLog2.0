const express = require('express');
const app = express();

const itemsRouter = require('./routes/items')

app.use(express.json())

app.use('/api/v1/items', itemsRouter)

const port = 3000; // temporary

const start = async () => {
    try {
      // await connectDB(process.env.MONGO_URI)
      app.listen(port, () =>
        console.log(`Server is listening on port ${port}...`)
      );
    } catch (error) {
      console.log(error);
    }
  };
  
  start();