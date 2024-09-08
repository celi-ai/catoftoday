import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get, increment, serverTimestamp, runTransaction, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app-check.js";

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

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'), // Use your actual reCAPTCHA site key
    isTokenAutoRefreshEnabled: true // Automatically refresh AppCheck tokens
});

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
                patCount: userData.patCount || 0,
                userId: childSnapshot.key
            });
        });

        // Sort in descending order
        leaderboardData.sort((a, b) => b.patCount - a.patCount);

        // Update total holders
        const totalHoldersElement = document.getElementById('totalHolders');
        totalHoldersElement.textContent = `${snapshot.size} holders`;

        // Update leaderboard UI
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
    return new Promise((resolve, reject) => {
        const catImageFilename = getCatOfTheDay();
        const imageRef = storageRef(storage, 'cat_images/' + catImageFilename);
        
        getDownloadURL(imageRef).then((url) => {
            const img = catContainer.querySelector('img');
            img.onload = () => {
                console.log("Cat image loaded:", url);
                resolve();
            };
            img.onerror = (error) => {
                console.error("Error loading cat image:", error);
                reject(error);
            };
            img.src = url;
            img.alt = "Cat of Today";
        }).catch((error) => {
            console.error("Error getting cat image URL:", error);
            reject(error);
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

async function initialize() {
    console.log("Starting initialization...");
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressBar = document.querySelector('.progress-bar');
    const catTail = document.querySelector('.cat-tail');
    const steps = [
        'Checking and resetting',
        'Updating daily login',
        'Updating user data',
        'Updating cat image',
        'Updating leaderboard',
        'Setting up navigation',
        'Initializing buy pats',
        'Initializing particles'
    ];
    let progress = 0;

    async function updateProgress(step) {
        console.log(step + "...");
        progress += 100 / steps.length;
        progressBar.style.width = `${progress}%`;
        catTail.style.backgroundPosition = `-${progress}px 0`; // Animate tail
        await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay for smoother animation
    }

    try {
        await updateProgress(steps[0]);
        await checkAndResetIfNeeded();
        
        await updateProgress(steps[1]);
        await checkAndUpdateDailyLogin();
        
        await updateProgress(steps[2]);
        await runTransaction(userRef, (userData) => {
            if (userData) {
                userData.username = userUsername;
                return userData;
            }
            return null;
        });
        
        await updateProgress(steps[3]);
        await updateCatImage();
        
        await updateProgress(steps[4]);
        updateLeaderboard();
        
        await updateProgress(steps[5]);
        setupTabNavigation();

        await updateProgress(steps[6]);
        initializeBuyPats(tg, userId);

        await updateProgress(steps[7]);
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
        
        console.log("Initialization complete!");
    } catch (error) {
        console.error("Error during initialization:", error);
    } finally {
        console.log("Fading out loading overlay...");
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                console.log("Loading overlay hidden.");
            }, 500); // Wait for fade-out transition to complete
        } else {
            console.error("Loading overlay element not found!");
        }
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

// Call initialize function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded. Calling initialize...");
    initialize();
});

// Expand to full screen
tg.expand();

// Add this at the end of the file
console.log("app.js loaded and executed.");