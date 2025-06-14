// index.js
const express = require('express');
const app = express();
const fraudRoutes = require('./routes/fraudRoutes');

const path = require('path');

app.use(express.json()); // Parse JSON bodies
app.use('/api', fraudRoutes);


// Serve static files from /public folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => console.log('Server running on port 3000'));
