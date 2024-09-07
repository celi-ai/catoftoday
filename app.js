import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getDatabase, ref, onValue, set, get, increment, serverTimestamp, runTransaction, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';
import { getStorage, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';
import { initializeBuyPats } from './buyPats.js';

console.log("Firebase modules imported successfully");

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

let db;
let storage;
let countRef;
let lastResetRef;
let userRef;
let userPatCountRef;
let userAvailablePatsRef;
let userStreakRef;
let userLastLoginRef;

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

// Get user data from Telegram
const user = tg.initDataUnsafe.user;
const userId = user ? user.id.toString() : 'anonymous';
const userName = user ? user.first_name : 'Anonymous';
const userUsername = user ? user.username : 'unknown_user';

async function initializeApplication() {
    console.log("Starting initialization...");
    try {
        console.log("Initializing Firebase...");
        const app = initializeApp(firebaseConfig);
        console.log("Firebase app initialized");
        db = getDatabase(app);
        console.log("Firebase database initialized");
        storage = getStorage(app);
        console.log("Firebase storage initialized");
        
        countRef = ref(db, 'globalPatCount');
        lastResetRef = ref(db, 'lastResetTimestamp');
        userRef = ref(db, `users/${userId}`);
        userPatCountRef = ref(db, `users/${userId}/patCount`);
        userAvailablePatsRef = ref(db, `users/${userId}/availablePats`);
        userStreakRef = ref(db, `users/${userId}/streak`);
        userLastLoginRef = ref(db, `users/${userId}/lastLogin`);

        console.log("Firebase initialized successfully");

        userNameElement.textContent = userName;

        console.log("Checking and resetting if needed...");
        await checkAndResetIfNeeded();
        
        console.log("Checking and updating daily login...");
        await checkAndUpdateDailyLogin();
        
        console.log("Updating user data...");
        await updateUserData();
        
        console.log("Updating cat image...");
        await updateCatImage();
        
        console.log("Updating leaderboard...");
        updateLeaderboard();
        
        console.log("Setting up tab navigation...");
        setupTabNavigation();

        console.log("Initializing buy pats functionality...");
        initializeBuyPats(tg);

        console.log("Setting up listeners...");
        setupListeners();

        console.log("Initialization complete!");
    } catch (error) {
        console.error("Error during initialization:", error);
    } finally {
        console.log("Fading out loading overlay...");
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                console.log("Loading overlay hidden.");
            }, 500);
        } else {
            console.error("Loading overlay element not found!");
        }
    }
}

async function checkAndResetIfNeeded() {
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
        return false;
    } catch (error) {
        console.error("Error in checkAndResetIfNeeded:", error);
        return false;
    }
}

async function checkAndUpdateDailyLogin() {
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
}

async function updateUserData() {
    await runTransaction(userRef, (userData) => {
        if (userData) {
            userData.username = userUsername;
            return userData;
        }
        return null;
    });
}

function updateCatImage() {
    return new Promise((resolve, reject) => {
        const catImageFilename = getCatOfTheDay();
        console.log("Attempting to load cat image:", catImageFilename);
        const imageRef = storage.ref('cat_images/' + catImageFilename);
        
        imageRef.getDownloadURL().then((url) => {
            console.log("Got download URL:", url);
            const img = catContainer.querySelector('img');
            img.onload = () => {
                console.log("Cat image loaded successfully:", url);
                resolve();
            };
            img.onerror = (error) => {
                console.error("Error loading cat image:", error);
                img.src = 'https://via.placeholder.com/400x400.png?text=Cat+of+Today';
                resolve();
            };
            img.src = url;
            img.alt = "Cat of Today";
        }).catch((error) => {
            console.error("Error getting cat image URL:", error);
            console.log("Error code:", error.code);
            console.log("Error message:", error.message);
            const img = catContainer.querySelector('img');
            img.src = 'https://via.placeholder.com/400x400.png?text=Cat+of+Today';
            img.alt = "Default Cat";
            resolve();
        });
    });
}

function updateLeaderboard() {
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

function setupListeners() {
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

    catContainer.addEventListener('click', handleCatClick);
}

async function handleCatClick(event) {
    if (user) {
        try {
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
                    return null;
                }

                if (userData.availablePats > 0) {
                    userData.patCount = (userData.patCount || 0) + 1;
                    userData.availablePats--;
                    userData.name = userName;
                    userData.username = userUsername;
                    return userData;
                } else {
                    return undefined;
                }
            });

            if (result.committed) {
                const audio = new Audio('pat-sound.mp3');
                audio.play();

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
}

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

function createParticles(x, y) {
    const particleCount = 5;
    const particleTypes = ['✨', '🐾'];
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x + (Math.random() - 0.5) * 50}px`;
        particle.style.top = `${y + (Math.random() - 0.5) * 50}px`;
        particle.style.setProperty('--x', `${(Math.random() - 0.5) * 100}px`);
        particle.style.setProperty('--y', `${Math.random() * -50 - 25}px`);
        particle.innerText = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 500 + Math.random() * 250);
    }
}

const catImages = ['cat1.jpeg', 'cat2.jpeg', 'cat3.jpeg'];

function getCatOfTheDay() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return catImages[dayOfYear % catImages.length];
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

const catFacts = [
    "Cats can make over 100 different sounds, while dogs can only make about 10.",
    "A group of cats is called a 'clowder'.",
    "Cats spend 70% of their lives sleeping.",
    "A cat's nose print is unique, like a human's fingerprint.",
    "Cats can't taste sweetness.",
    "The first cat in space was a French cat named Felicette in 1963.",
    "Cats can jump up to 6 times their length.",
    "A cat's hearing is better than a dog's.",
    "Cats have 32 muscles in each ear.",
    "A cat's purr may be a form of self-healing."
];

function updateCatFact() {
    const factElement = document.querySelector('.cat-fact');
    if (factElement) {
        const randomFact = catFacts[Math.floor(Math.random() * catFacts.length)];
        factElement.textContent = `Did you know? ${randomFact}`;
    }
}

// Call initialize function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded. Calling initializeApplication...");
    initializeApplication();
    
    // Set up cat fact update interval
    setInterval(updateCatFact, 3500);
});

// Expand to full screen
tg.expand();

// Add this at the end of the file
console.log("app.js loaded and executed.");


