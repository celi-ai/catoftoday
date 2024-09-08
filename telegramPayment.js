// telegramPayment.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Function to create an invoice
exports.createInvoice = functions.https.onCall((data, context) => {
  const { title, description, payload, currency, prices } = data;
  
  // Validate input data here
  
  return {
    title,
    description,
    payload: JSON.stringify(payload),
    provider_token: "", // Leave empty for Telegram Stars
    currency,
    prices,
  };
});

// Function to handle pre-checkout query
exports.handlePreCheckoutQuery = functions.https.onCall((data, context) => {
  // You can add any validation logic here
  return { ok: true };
});

// Function to handle successful payment
exports.handleSuccessfulPayment = functions.https.onCall(async (data, context) => {
  const { userId, paymentInfo } = data;
  
  // Save payment information to Firestore
  const db = admin.firestore();
  await db.collection('payments').add({
    userId,
    paymentInfo,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Update user's available pats or other relevant data
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    availablePats: admin.firestore.FieldValue.increment(paymentInfo.patsAmount),
  });
  
  return { success: true };
});