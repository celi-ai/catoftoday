const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000; // Heroku assigns the port dynamically

// Serve the index.html and app.js directly from the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
