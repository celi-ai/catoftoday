const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000; // Heroku assigns the port dynamically

// Set up the Telegram bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Middleware for parsing JSON data from incoming requests
app.use(bodyParser.json());

// Serve the index.html and app.js directly from the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});

// Add Telegram bot route for handling messages
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to the Cat of Today game!");
});

// Generic webhook for processing Telegram commands
app.post('/webhook', (req, res) => {
  const message = req.body;
  console.log('Incoming message: ', message);
  res.status(200).send('Message received');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
