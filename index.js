const express = require('express');
const cors = require('cors');  // Import CORS middleware
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const app = express();

// Allow CORS only for your GitHub Pages domain
const corsOptions = {
    origin: 'https://celi-ai.github.io',  // Replace with your GitHub Pages URL
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));  // Enable CORS with the defined options

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

// Route to handle "Buy Pats" button click
app.post('/buy-pats', (req, res) => {
  console.log("POST /buy-pats called"); // This log should appear in Heroku logs
  const chatId = req.body.chatId; // Get the chatId from the request (you'll send this from the front-end)

  if (!chatId) {
    console.error('No chatId provided');
    return res.status(400).send({ success: false, message: 'chatId is required' });
  }
  
  // Define the price (same as in the /buy command)
  const prices = [{ label: "100 Pats", amount: 100 }];

  // Send invoice to the user
  bot.sendInvoice(chatId, "Buy More Pats", "Get 100 more pats for 1 XTR", "unique-payload", "", "XTR", prices)
    .then(() => {
      console.log("Invoice sent successfully");
      res.send({ success: true });
    })
    .catch((error) => {
        console.error('Error sending invoice:', error);  // Log errors here
        res.status(500).send({ success: false, message: 'Error sending invoice' });
    });
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
  bot.sendInvoice(chatId, "Buy More Pats", "Get 100 more pats for 1 XTR", "unique-payload", "", "XTR", prices).catch((error) => {
    console.error('Error sending invoice:', error);  // Log errors for debugging
  });
});

bot.onText(/\/pay/, (msg) => {
  console.log('Pay command received');
  const chatId = msg.chat.id;
  const prices = [{ label: "100 Pats", amount: 100 }];

  bot.sendInvoice(
    chatId,
    "Buy More Pats",
    "Get 100 more pats for 1 XTR",
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
    bot.sendMessage(msg.chat.id, 'Payment successful! Thank you for your purchase of 10 pats.');
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