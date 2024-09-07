const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Bot } = require('grammy');

// If you don't have this line already, add it:
if (!admin.apps.length) {
  admin.initializeApp();
}

const bot = new Bot(functions.config().telegram.bot_token);

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

exports.generateInvoice = functions.https.onRequest(async (request, response) => {
  // Enable CORS
  response.set('Access-Control-Allow-Origin', '*');
  
  if (request.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
    return;
  }

  const { amount } = request.body;
  if (!amount) {
    response.status(400).send('Amount is required');
    return;
  }

  try {
    const title = "Cat of Today Pat";
    const description = `Buy ${amount} pats for the Cat of Today`;
    const payload = JSON.stringify({ amount });
    const currency = "XTR";
    const prices = [{ amount: amount * 10, label: `${amount} Pats` }];

    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "", // Provider token must be empty for Telegram Stars
      currency,
      prices,
    );

    response.json({ invoiceLink });
  } catch (error) {
    console.error("Error generating invoice:", error);
    response.status(500).send('Failed to generate invoice');
  }
});