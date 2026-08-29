// Local development server. Production runs the same app through api/[...path].js
// on Vercel, which has no long-lived process to listen on a port.
require('dotenv').config();

const app = require('./app')
const connectDB = require('./db/connect')

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.error(error);
    process.exit(1); // otherwise the process lingers with the port closed, looking like a hang
  }
};

start();
