const express = require('express');
const app = express();

// Routes
app.get('/', (req, res) => {
    res.send('Waste Log')
})

const port = 3000; // temporary

app.listen(port, console.log(`Server running on port ${port}`))