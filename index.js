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

// Telegram bot commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to the Cat of Today game!");
});

// /buy command
bot.onText(/\/buy/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "You can buy more pats. How many pats do you want to buy?");
  // More options like inline keyboard or specific amounts can be added here
});

// /pay command
bot.onText(/\/pay/, (msg) => {
  const chatId = msg.chat.id;
  const invoice = {
    chat_id: chatId,
    title: "Purchase Pats",
    description: "Buy more pats to continue patting cats!",
    payload: "unique-payload", // Unique payload for tracking purchases
    provider_token: process.env.PAYMENT_PROVIDER_TOKEN, // Heroku environment variable for payment
    currency: "USD", // or your desired currency
    prices: [{ label: "100 Pats", amount: 100 * 100 }], // Example pricing, 100 Pats = $1.00
    start_parameter: "buy-pats",
    photo_url: "https://example.com/cat.jpg", // Optional, add a nice image
  };
  
  bot.sendInvoice(chatId, invoice.title, invoice.description, invoice.payload, invoice.provider_token, invoice.start_parameter, invoice.currency, invoice.prices, {
    photo_url: invoice.photo_url,
  });
  
  // Handling the payment
  bot.on('pre_checkout_query', (query) => {
    bot.answerPreCheckoutQuery(query.id, true); // Approving payment
  });

  bot.on('successful_payment', (payment) => {
    bot.sendMessage(chatId, 'Payment successful! Enjoy your pats!');
    console.log('Payment successful: ', payment);
  });
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
