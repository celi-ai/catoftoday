import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get, increment, serverTimestamp, runTransaction, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { firebaseConfig } from './firebase-config.js';
import { getDatabase } from "firebase/database";

try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    console.log("Firebase initialized:", app);
    const db = getDatabase(app);
    console.log("Database reference created:", db);
    const storage = getStorage(app);
    console.log("Storage reference created:", storage);
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

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

// Increment counter
catContainer.addEventListener('click', async (event) => {
    if (user) {
        try {
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
                tg.HapticFeedback.impactOccurred('medium');
                
                // Create multiple pat effects
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const patEffect = document.createElement('div');
                        patEffect.className = 'pat-effect';
                        patEffect.textContent = '❤️';
                        patEffect.style.left = `${event.clientX - catContainer.offsetLeft + (Math.random() * 40 - 20)}px`;
                        patEffect.style.top = `${event.clientY - catContainer.offsetTop + (Math.random() * 40 - 20)}px`;
                        catContainer.appendChild(patEffect);

                        // Remove pat effect after animation
                        setTimeout(() => {
                            patEffect.remove();
                        }, 800);
                    }, i * 100);
                }

                // Play pat sound
                const patSound = document.getElementById('patSound');
                patSound.currentTime = 0;
                patSound.play();

                // Add screen shake effect
                document.body.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    document.body.style.animation = '';
                }, 500);

                // Animate pat count and available pats
                animateValue(userPatCountElement, parseInt(userPatCountElement.textContent), parseInt(userPatCountElement.textContent) + 1, 500);
                animateValue(availablePatsElement, parseInt(availablePatsElement.textContent), parseInt(availablePatsElement.textContent) - 1, 500);
                animateValue(counterElement, parseInt(counterElement.textContent), parseInt(counterElement.textContent) + 1, 500);
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
        catContainer.style.backgroundImage = `url("${url}")`;
        console.log("Cat image updated:", url);
    }).catch((error) => {
        console.error("Error getting cat image:", error);
    });
}

// Initial setup
async function initialize() {
    try {
        console.log("Starting initialization...");
        const resetResult = await checkAndResetIfNeeded();
        console.log("Reset check result:", resetResult);
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
        
        updateCatImage();
        updateLeaderboard();
        console.log("Initialization complete");
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}
initialize();

// Expand to full screen
tg.expand();