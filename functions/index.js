const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');

// Initialize the bot with your token
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const app = express();

// Middleware to parse incoming requests
app.use(bodyParser.json());

// Webhook route for Telegram bot
app.post('/bot', (req, res) => {
  bot.processUpdate(req.body);  // Process incoming updates from Telegram
  res.sendStatus(200);
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello! Welcome to the mini-app.');
});

// Payment-related logic
bot.command('pay', (msg) => {
  const title = "Test Product";
  const description = "Test description";
  const payload = "test_payload";
  const currency = "XTR";
  const price = [{ amount: 100 * 100, label: "Test Product" }];

  // Send invoice to the user
  bot.sendInvoice(
    msg.chat.id,
    title,
    description,
    payload,
    "",  // Leave provider_token empty for Telegram Stars
    currency,
    price,
    {
      need_name: true,  // Ask for the name (optional)
      need_email: true, // Ask for the email (optional)
    }
  ).catch((error) => {
    console.error('Error sending invoice:', error);  // Log errors for debugging
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
    bot.sendMessage(msg.chat.id, 'Payment successful! Thank you for your purchase.');
  }
});

// Check payment status
bot.command("status", (msg) => {
  const message = paidUsers.has(msg.from.id)
    ? "You have paid"
    : "You have not paid yet";
  bot.sendMessage(msg.chat.id, message);
});

// Refund logic (if applicable)
bot.command("refund", (msg) => {
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

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
