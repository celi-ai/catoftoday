const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Telegraf } = require('telegraf');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Telegram bot
const bot = new Telegraf(functions.config().telegram.token);

// Bot commands
bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'));

/* from example found online
bot.command('pay', (ctx) => {
  return ctx.replyWithInvoice(
    "Test Product", // Product title
    "Test description", // Product description
    "{}", // Product payload, not required for now
    "XTR", // Stars Currency 
    [{ amount: 100, label: "Test Product" }], // Product variants (100 Stars)
    {
      provider_token: "", // Empty for Telegram Stars
      currency: "XTR"
    }
  );
});
*/

bot.command('pay', (ctx) => {
  const title = "Test Product";
  const description = "Test description";
  const payload = "test_payload";
  const currency = "XTR";
  const price = [{ amount: 100, label: "Test Product" }];

  console.log('Pay command received');
  console.log('Title:', title);
  console.log('Description:', description);
  console.log('Payload:', payload);
  console.log('Currency:', currency);
  console.log('Price:', price);

  return ctx.replyWithInvoice(
    title,            // Product title
    description,      // Product description
    payload,          // Payload
    "",               // Empty provider token for Telegram Stars
    currency,         // Currency (XTR for Telegram Stars)
    price,            // Price in Stars (100 Stars)
    {
      need_name: true,  // Ask for name (optional)
      need_email: true, // Ask for email (optional)
    }
  ).catch((error) => {
    console.error('Error sending invoice:', error);
  });
});

// Handle pre-checkout query
bot.on("pre_checkout_query", (ctx) => {
  return ctx.answerPreCheckoutQuery(true).catch(() => {
    console.error("answerPreCheckoutQuery failed");
  });
});

// Map is used for simplicity. For production use a database
const paidUsers = new Map();

// Handle successful payment
bot.on("message:successful_payment", (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
    return;
  }

  paidUsers.set(
    ctx.from.id,
    ctx.message.successful_payment.telegram_payment_charge_id,
  );

  console.log(ctx.message.successful_payment);
  ctx.reply("Payment successful! Thank you for your purchase.");
});

// Check payment status
bot.command("status", (ctx) => {
  const message = paidUsers.has(ctx.from.id)
    ? "You have paid"
    : "You have not paid yet";
  return ctx.reply(message);
});

// Refund command
bot.command("refund", (ctx) => {
  const userId = ctx.from.id;
  if (!paidUsers.has(userId)) {
    return ctx.reply("You have not paid yet, there is nothing to refund");
  }

  ctx.api
    .refundStarPayment(userId, paidUsers.get(userId))
    .then(() => {
      paidUsers.delete(userId);
      return ctx.reply("Refund successful");
    })
    .catch(() => ctx.reply("Refund failed"));
});

// Function to create invoice link for mini apps
exports.generateInvoice = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { title, description, amount, patsAmount } = data;

  try {
    const invoiceLink = await bot.telegram.createInvoiceLink(
      title || "Pats Purchase",
      description || "Purchase pats for your cat",
      JSON.stringify({ patsAmount, userId: context.auth.uid }),
      "", // Provider token must be empty for Telegram Stars
      "XTR",
      [{ amount, label: title || "Pats" }]
    );

    return { success: true, invoiceLink };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new functions.https.HttpsError('internal', 'Error creating invoice', error);
  }
});

// Webhook handler
exports.botWebhook = functions.https.onRequest((req, res) => {
  bot.handleUpdate(req.body, res);
});

// Existing functions
exports.incrementPatCount = functions.https.onCall((data, context) => {
  const patCountRef = admin.database().ref('patCount');
  return patCountRef.transaction((currentCount) => {
    return (currentCount || 0) + 1;
  });
});

exports.getPatCount = functions.https.onCall(async (data, context) => {
  const patCountRef = admin.database().ref('patCount');
  const snapshot = await patCountRef.once('value');
  return snapshot.val() || 0;
});

