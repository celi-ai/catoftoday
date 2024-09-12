const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const app = express();


/*
// Replace these with your actual Supabase URL and API Key from the Supabase dashboard
const SUPABASE_URL = 'https://sleghazbpzgynnzriozz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZWdoYXpicHpneW5uenJpb3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4ODc5MDQsImV4cCI6MjA0MTQ2MzkwNH0.ltjHJAEnQBYko4Om6pwQRU5xp6QsQfkYyZwEBKG71xA';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

*/

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to parse incoming requests
app.use(bodyParser.json());

// Webhook route for Telegram bot
app.post('/bot', (req, res) => {
  bot.processUpdate(req.body);  // Process incoming updates from Telegram
  res.sendStatus(200);
});

// Root route for the app
app.get('/', (req, res) => {
  res.send('Welcome to the Cat of Today app!');
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello! Welcome to the mini-app.');
});

// Handle /buy command to start the payment process
bot.onText(/\/buy/, (msg) => {
  console.log('Buy command received');
  const chatId = msg.chat.id;

  // Define the price (in Telegram Stars or XTR)
  const prices = [{ label: "100 Pats", amount: 100 }];  // Amount in smallest unit of XTR

  // Send invoice to the user
  bot.sendInvoice(chatId, "Buy More Pats", "Get 100 more pets for 1 XTR", "unique-payload", "", "XTR", prices).catch((error) => {
    console.error('Error sending invoice:', error);  // Log errors for debugging
  });
});

bot.onText(/\/pay/, (msg) => {
  console.log('Pay command received');
  const chatId = msg.chat.id;
  const prices = [{ label: "100 Pats", amount: 100 }];

  bot.sendInvoice(
    chatId,
    "Buy More Pets",
    "Get 100 more pets for 1 XTR",
    "unique-payload",
    "", // Provider token for Telegram Stars
    "XTR", // Currency
    prices
  ).catch((error) => {
    console.error('Error sending invoice:', error);
  });
});

// Handle pre-checkout query (sent before the payment is finalized)
bot.on('pre_checkout_query', (query) => {
  bot.answerPreCheckoutQuery(query.id, true).catch((error) => {
    console.error("Error answering pre_checkout_query:", error);
  });
});

// Store successful payments in memory (for testing purposes, consider using a real database in production)
const paidUsers = new Map();

// Handle successful payments
bot.on('message', (msg) => {
  if (msg.successful_payment) {
    paidUsers.set(msg.from.id, msg.successful_payment.telegram_payment_charge_id);
    console.log('Payment successful:', msg.successful_payment);
    bot.sendMessage(msg.chat.id, 'Payment successful! Thank you for your purchase of 10 pets.');
  }
});

// Check payment status
bot.onText(/\/status/, (msg) => {
  const message = paidUsers.has(msg.from.id)
    ? "You have paid"
    : "You have not paid yet";
  bot.sendMessage(msg.chat.id, message);
});

// Refund logic (if applicable)
bot.onText(/\/refund/, (msg) => {
  const userId = msg.from.id;
  if (!paidUsers.has(userId)) {
    return bot.sendMessage(msg.chat.id, "You have not paid yet, there is nothing to refund.");
  }

  bot.api
    .refundStarPayment(userId, paidUsers.get(userId))  // Using Telegram Star's refund API
    .then(() => {
      paidUsers.delete(userId);
      bot.sendMessage(msg.chat.id, "Refund successful.");
    })
    .catch((error) => {
      console.error("Refund failed:", error);
      bot.sendMessage(msg.chat.id, "Refund failed.");
    });
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
