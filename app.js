import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get, increment, serverTimestamp, runTransaction, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

import { initializeBuyPats } from './buyPats.js';

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

const countRef = ref(db, 'globalPatCount');
const lastResetRef = ref(db, 'lastResetTimestamp');
const counterElement = document.getElementById('counter');
const catContainer = document.getElementById('catContainer');
const userPatCountElement = document.getElementById('userPatCount');
const userNameElement = document.getElementById('userName');
const availablePatsElement = document.getElementById('availablePats');
const userStreakElement = document.getElementById('userStreak');
const leaderboardListElement = document.getElementById('leaderboardList');

// Telegram WebApp initialization
const tg = window.Telegram.WebApp;

// Ensure the app is ready
tg.ready();

async function checkAndResetIfNeeded() {
    try {
        const lastResetSnapshot = await get(lastResetRef);
        const lastReset = lastResetSnapshot.val();
        const now = Date.now();

        console.log("Last reset:", lastReset);
        console.log("Current time:", now);

        if (!lastReset || (now - lastReset > 24 * 60 * 60 * 1000)) {
            console.log("Resetting counters and updating timestamp");
            await set(countRef, 0);
            await set(lastResetRef, serverTimestamp());
            updateCatImage();
            return true;
        }
        console.log("No reset needed");
        return false;
    } catch (error) {
        console.error("Error in checkAndResetIfNeeded:", error);
        return false;
    }
}

// Get user data from Telegram
const user = tg.initDataUnsafe.user;
const userId = user ? user.id.toString() : 'anonymous';
const userName = user ? user.first_name : 'Anonymous';
const userUsername = user ? user.username : 'unknown_user';

userNameElement.textContent = userName;

const userRef = ref(db, `users/${userId}`);
const userPatCountRef = ref(db, `users/${userId}/patCount`);
const userAvailablePatsRef = ref(db, `users/${userId}/availablePats`);
const userStreakRef = ref(db, `users/${userId}/streak`);
const userLastLoginRef = ref(db, `users/${userId}/lastLogin`);

async function checkAndUpdateDailyLogin() {
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val() || {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();

    if (!userData.lastLogin || userData.lastLogin !== today) {
        // It's a new day
        let newStreak = 1;
        if (userData.lastLogin === yesterday) {
            // User logged in yesterday, increment streak
            newStreak = (userData.streak || 0) + 1;
        }

        // Calculate new available pats
        const newAvailablePats = 10 + (newStreak * 10);

        // Update user data
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
}

// Initialize counters
get(countRef).then((snapshot) => {
    const count = snapshot.val() || 0;
    counterElement.textContent = count;
}).catch(error => console.error("Error getting global count:", error));

get(userPatCountRef).then((snapshot) => {
    const count = snapshot.val() || 0;
    userPatCountElement.textContent = count;
}).catch(error => console.error("Error getting user count:", error));

get(userAvailablePatsRef).then((snapshot) => {
    const count = snapshot.val() || 0;
    availablePatsElement.textContent = count;
}).catch(error => console.error("Error getting available pats:", error));

get(userStreakRef).then((snapshot) => {
    const streak = snapshot.val() || 0;
    userStreakElement.textContent = streak;
}).catch(error => console.error("Error getting user streak:", error));

// Listen for real-time updates
onValue(countRef, (snapshot) => {
    const count = snapshot.val() || 0;
    counterElement.textContent = count;
}, error => console.error("Error in global count listener:", error));

onValue(userPatCountRef, (snapshot) => {
    const count = snapshot.val() || 0;
    userPatCountElement.textContent = count;
}, error => console.error("Error in user count listener:", error));

onValue(userAvailablePatsRef, (snapshot) => {
    const count = snapshot.val() || 0;
    availablePatsElement.textContent = count;
}, error => console.error("Error in available pats listener:", error));

onValue(userStreakRef, (snapshot) => {
    const streak = snapshot.val() || 0;
    userStreakElement.textContent = streak;
}, error => console.error("Error in user streak listener:", error));

// Function to update leaderboard
function updateLeaderboard() {
    const leaderboardRef = ref(db, 'users');
    const leaderboardQuery = query(leaderboardRef, orderByChild('patCount'), limitToLast(10));

    onValue(leaderboardQuery, (snapshot) => {
        const leaderboardData = [];
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            leaderboardData.push({
                username: userData.username || userData.name || 'unknown_user',
                patCount: userData.patCount || 0
            });
        });

        // Sort in descending order
        leaderboardData.sort((a, b) => b.patCount - a.patCount);

        // Update leaderboard UI
        leaderboardListElement.innerHTML = '';
        leaderboardData.forEach((user, index) => {
            const li = document.createElement('li');
            const displayName = user.username.startsWith('@') ? user.username : `@${user.username}`;
            li.textContent = `${index + 1}. ${displayName}: ${user.patCount} pats`;
            leaderboardListElement.appendChild(li);
        });
    }, (error) => {
        console.error("Error fetching leaderboard data:", error);
    });
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

// Increment counter
catContainer.addEventListener('click', async (event) => {
    if (user) {
        try {
            // Immediate feedback
            createParticles(event.clientX, event.clientY);
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }

            const wasReset = await checkAndResetIfNeeded();
            if (!wasReset) {
                await set(countRef, increment(1));
            }

            const result = await runTransaction(userRef, (userData) => {
                if (!userData) {
                    return null; // abort the transaction
                }

                if (userData.availablePats > 0) {
                    userData.patCount = (userData.patCount || 0) + 1;
                    userData.availablePats--;
                    userData.name = userName;
                    userData.username = userUsername;
                    return userData;
                } else {
                    return undefined; // abort the transaction
                }
            });

            if (result.committed) {
                // Play sound effect
                const audio = new Audio('pat-sound.mp3');
                audio.play();

                // Animate pat count and available pats
                animateValue(userPatCountElement, parseInt(userPatCountElement.textContent), parseInt(userPatCountElement.textContent) + 1, 300);
                animateValue(availablePatsElement, parseInt(availablePatsElement.textContent), parseInt(availablePatsElement.textContent) - 1, 300);
                animateValue(counterElement, parseInt(counterElement.textContent), parseInt(counterElement.textContent) + 1, 300);
            } else {
                alert("You're out of pats! Come back tomorrow for more pats.");
            }
        } catch (error) {
            console.error("Error incrementing counters:", error);
        }
    } else {
        alert("Please open this app in Telegram to pat the cat!");
    }
});


// Cat image functionality
const catImages = ['cat1.jpeg', 'cat2.jpeg', 'cat3.jpeg'];
function getCatOfTheDay() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return catImages[dayOfYear % catImages.length];
}
function updateCatImage() {
    const catImageFilename = getCatOfTheDay();
    const imageRef = storageRef(storage, 'cat_images/' + catImageFilename);
    
    getDownloadURL(imageRef).then((url) => {
        const img = catContainer.querySelector('img');
        img.src = url;
        img.alt = "Cat of Today";
        console.log("Cat image updated:", url);
    }).catch((error) => {
        console.error("Error getting cat image:", error);
    });
}

// Initial setup
async function initialize() {
    try {
        await checkAndResetIfNeeded();
        await checkAndUpdateDailyLogin();
        
        // Update user data with current username
        await runTransaction(userRef, (userData) => {
            if (userData) {
                userData.username = userUsername;
                return userData;
            }
            return null;
        });
        
        updateCatImage();
        updateLeaderboard();
        setupTabNavigation();

        // Initialize buy pats functionality
        initializeBuyPats(tg);

        // Initialize particle.js for background effect
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#ffffff" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                move: { enable: true, speed: 1, direction: "none", random: true, out_mode: "out" }
            }
        });
        
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(tabId).classList.remove('hidden');
        });
    });
}

initialize();

// Expand to full screen
tg.expand();