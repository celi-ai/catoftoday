import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCAZJHR6oxJnefsiLGbutLK10NK4JGLiko",
    authDomain: "catoftoday-e2451.firebaseapp.com",
    databaseURL: "https://catoftoday-e2451-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "catoftoday-e2451",
    storageBucket: "catoftoday-e2451.appspot.com",
    messagingSenderId: "246259753230",
    appId: "1:246259753230:web:abc91475e03e9f13cf775f",
    measurementId: "G-53VSVBFRK1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

export { db, storage };