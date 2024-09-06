// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAZJHW6oxJnefs1LGbutLK1OWK4JGLiKo",
  authDomain: "catoftoday-e2451.firebaseapp.com",
  databaseURL: "https://catoftoday-e2451-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "catoftoday-e2451",
  storageBucket: "catoftoday-e2451.appspot.com",
  messagingSenderId: "246259753230",
  appId: "1:246259753230:web:abc91475e03e9f13cf775f",
  measurementId: "G-53VSVBFRK1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
getAnalytics(app);

// Get a reference to the database service
const database = firebase.database();

// Reference to the globalPatCount in the database
const globalPatCountRef = database.ref('globalPatCount');

// Function to update the display
function updateGlobalPatCount(count) {
  document.getElementById('globalPatCount').textContent = `Global Pat Count: ${count}`;
}

// Listen for changes in the globalPatCount
globalPatCountRef.on('value', (snapshot) => {
  const count = snapshot.val() || 0;
  updateGlobalPatCount(count);
});

// Function to increment the pat count
function incrementPatCount() {
  globalPatCountRef.transaction((currentCount) => {
    return (currentCount || 0) + 1;
  });
}

// Add click event listener to the cat container
document.getElementById('catContainer').addEventListener('click', incrementPatCount);

// Display the current date
const dateDisplay = document.getElementById('dateDisplay');
dateDisplay.textContent = new Date().toDateString();