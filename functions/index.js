const functions = require('firebase-functions');
const admin = require('firebase-admin');

// If you don't have this line already, add it:
if (!admin.apps.length) {
  admin.initializeApp();
}

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