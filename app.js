import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get, increment, serverTimestamp, runTransaction, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

import { initializeBuyPats } from './buyPats.js';

console.log("Starting app initialization...");

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

console.log("Firebase initialized");

const tg = window.Telegram.WebApp;
tg.ready();

console.log("Telegram WebApp ready");

// Global variables
const user = tg.initDataUnsafe.user;
const userId = user ? user.id.toString() : 'anonymous';
const userName = user ? user.first_name : 'Anonymous';
const userUsername = user ? user.username : 'unknown_user';

console.log("User information retrieved");

// DOM elements
const counterElement = document.getElementById('counter');
const catContainer = document.getElementById('catContainer');
const userPatCountElement = document.getElementById('userPatCount');
const userNameElement = document.getElementById('userName');
const availablePatsElement = document.getElementById('availablePats');
const userStreakElement = document.getElementById('userStreak');
const leaderboardListElement = document.getElementById('leaderboardList');

console.log("DOM elements referenced");

// Firebase references
const countRef = ref(db, 'globalPatCount');
const lastResetRef = ref(db, 'lastResetTimestamp');
const userRef = ref(db, `users/${userId}`);
const userPatCountRef = ref(db, `users/${userId}/patCount`);
const userAvailablePatsRef = ref(db, `users/${userId}/availablePats`);
const userStreakRef = ref(db, `users/${userId}/streak`);
const userLastLoginRef = ref(db, `users/${userId}/lastLogin`);

console.log("Firebase references created");

// Tab system
let currentTab = 'homeTab';

function showTab(tabId) {
    console.log(`Switching to tab: ${tabId}`);
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    currentTab = tabId;

    if (tabId === 'topTab') {
        updateLeaderboard();
    }
}

function setupTabNavigation() {
    console.log("Setting up tab navigation");
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            showTab(tabId);
        });
    });
}

// Leaderboard functionality
function updateLeaderboard() {
    if (currentTab !== 'topTab') return;
    console.log("Updating leaderboard");

    const leaderboardRef = ref(db, 'users');
    const leaderboardQuery = query(leaderboardRef, orderByChild('patCount'), limitToLast(10));

    onValue(leaderboardQuery, (snapshot) => {
        const leaderboardData = [];
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            leaderboardData.push({
                username: userData.username || userData.name || 'unknown_user',
                patCount: userData.patCount || 0,
                userId: childSnapshot.key
            });
        });

        leaderboardData.sort((a, b) => b.patCount - a.patCount);

        const totalHoldersElement = document.getElementById('totalHolders');
        totalHoldersElement.textContent = `${snapshot.size} holders`;

        const leaderboardListElement = document.getElementById('leaderboardList');
        const currentUserRankElement = document.getElementById('currentUserRank');
        leaderboardListElement.innerHTML = '';
        currentUserRankElement.innerHTML = '';

        leaderboardData.forEach((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.userId === userId;
            const entryHtml = createLeaderboardEntryHtml(user, rank, isCurrentUser);

            if (isCurrentUser) {
                currentUserRankElement.innerHTML = entryHtml;
            } else {
                leaderboardListElement.innerHTML += entryHtml;
            }
        });
        console.log("Leaderboard updated");
    }, (error) => {
        console.error("Error fetching leaderboard data:", error);
    });
}

function createLeaderboardEntryHtml(user, rank, isCurrentUser) {
    const initials = user.username.substring(0, 2).toUpperCase();
    const backgroundColor = isCurrentUser ? 'bg-blue-500' : `bg-${['red', 'pink', 'yellow', 'green', 'blue', 'indigo', 'purple'][Math.floor(Math.random() * 7)]}-500`;
    
    let rankDisplay;
    if (rank <= 3) {
        const medals = ['🥇', '🥈', '🥉'];
        rankDisplay = `<span class="medal">${medals[rank - 1]}</span>`;
    } else {
        rankDisplay = `#${rank}`;
    }
    
    return `
        <li class="leaderboard-entry">
            <div class="user-circle ${backgroundColor}">${initials}</div>
            <div class="user-info">
                <div class="username">@${user.username}</div>
                <div class="pat-count">${user.patCount} pats</div>
            </div>
            <div class="rank">${rankDisplay}</div>
        </li>
    `;
}

// Function to animate value changes
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        element.classList.add('highlight');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            setTimeout(() => element.classList.remove('highlight'), 500);
        }
    };
    window.requestAnimationFrame(step);
}

// Particle effect when patting
function createParticles(x, y) {
    const particleCount = 5; // Reduced from 20
    const particleTypes = ['✨', '🐾']; // Reduced variety
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x + (Math.random() - 0.5) * 50}px`; // Reduced spread
        particle.style.top = `${y + (Math.random() - 0.5) * 50}px`; // Reduced spread
        particle.style.setProperty('--x', `${(Math.random() - 0.5) * 100}px`);
        particle.style.setProperty('--y', `${Math.random() * -50 - 25}px`);
        particle.innerText = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 500 + Math.random() * 250); // Shorter duration
    }
}

async function checkAndResetIfNeeded() {
    console.log("Checking if reset is needed");
    try {
        const lastResetSnapshot = await get(lastResetRef);
        const lastReset = lastResetSnapshot.val();
        const now = Date.now();

        if (!lastReset || (now - lastReset > 24 * 60 * 60 * 1000)) {
            console.log("Resetting counters and updating timestamp");
            await set(countRef, 0);
            await set(lastResetRef, serverTimestamp());
            await updateCatImage();
            return true;
        }
        console.log("No reset needed");
        return false;
    } catch (error) {
        console.error("Error in checkAndResetIfNeeded:", error);
        return false;
    }
}

async function checkAndUpdateDailyLogin() {
    console.log("Checking and updating daily login");
    try {
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};
        const now = new Date();
        const today = now.toDateString();
        const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();

        if (!userData.lastLogin || userData.lastLogin !== today) {
            let newStreak = 1;
            if (userData.lastLogin === yesterday) {
                newStreak = (userData.streak || 0) + 1;
            }

            const newAvailablePats = 10 + (newStreak * 10);

            await set(userRef, {
                ...userData,
                name: userName,
                username: userUsername,
                streak: newStreak,
                lastLogin: today,
                availablePats: newAvailablePats,
                patCount: userData.patCount || 0
            });

            console.log("Updated daily login data");
        }
    } catch (error) {
        console.error("Error in checkAndUpdateDailyLogin:", error);
    }
}

// Initialize the app
async function initialize() {
    console.log("Starting initialization...");
    try {
        await checkAndResetIfNeeded();
        console.log("Reset check completed");
        
        await checkAndUpdateDailyLogin();
        console.log("Daily login updated");
        
        await runTransaction(userRef, (userData) => {
            if (userData) {
                userData.username = userUsername;
                return userData;
            }
            return null;
        });
        console.log("User data updated");
        
        await updateCatImage();
        console.log("Cat image updated");
        
        setupTabNavigation();
        console.log("Tab navigation set up");
        
        showTab('homeTab'); // Start with home tab
        console.log("Home tab shown");
        
        initializeBuyPats(tg);
        console.log("Buy pats initialized");
        
        console.log("Initialization complete!");
    } catch (error) {
        console.error("Error during initialization:", error);
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                console.log("Loading overlay hidden");
            }, 500);
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, calling initialize...");
    initialize().catch(error => {
        console.error("Initialization failed:", error);
        alert("Failed to initialize the app. Please try refreshing the page.");
    });
});

// Expand to full screen
tg.expand();

console.log("app.js loaded and executed.");