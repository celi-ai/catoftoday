
// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm'

// Replace these with your actual Supabase URL and API Key from the Supabase dashboard
const SUPABASE_URL = 'https://sleghazbpzgynnzriozz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZWdoYXpicHpneW5uenJpb3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4ODc5MDQsImV4cCI6MjA0MTQ2MzkwNH0.ltjHJAEnQBYko4Om6pwQRU5xp6QsQfkYyZwEBKG71xA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('Supabase client initialized');

// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
tg.ready();

// Get user data from Telegram
const user = tg.initDataUnsafe.user;
const userId = user ? user.id.toString() : 'anonymous';
const userName = user ? user.first_name : 'Anonymous';
const userUsername = user ? user.username : 'unknown_user';

// Global variables
let patCount = 0;
let availablePats = 0;
let streak = 0;
let multiplier = 1;

//button click experiment

// DOM Elements
const clickerButton = document.getElementById('clicker');
const clicksCountDisplay = document.getElementById('clicks-count');
const globalPatsBarElement = document.getElementById('global-pats-bar');

// Function to update the counter
async function incrementCounter() {
    // Fetch current count from Supabase
    let { data, error } = await supabase
        .from('clicks')
        .select('count')
        .eq('id', 1)
        .single();

    if (error && error.details === "The result contains 0 rows") {
        // If no rows exist, create the initial row
        let { error: insertError } = await supabase
            .from('clicks')
            .insert({ id: 1, count: 1 });
        
        if (insertError) {
            console.error("Error inserting new count:", insertError);
            return;
        }

        // Set UI
        clicksCountDisplay.textContent = 1;
        return;
    }

    let currentCount = data ? data.count : 0;
    let newCount = currentCount + 1;

    // Update count in Supabase
    let { updateError } = await supabase
        .from('clicks')
        .update({ count: newCount })
        .eq('id', 1);

    if (updateError) {
        console.error("Error updating count:", updateError);
        return;
    }

    // Update UI
    clicksCountDisplay.textContent = newCount;
    globalPatsBarElement.style.width = (newCount / 5000) * 100 + '%';
}

// Event Listener
clickerButton.addEventListener('click', incrementCounter);

// Initialize clicker with current count
async function initClicker() {
    let { data, error } = await supabase
        .from('clicks')
        .select('count')
        .eq('id', 1)
        .single();

    if (error && error.details === "The result contains 0 rows") {
        // If no rows exist, set default to 0
        clicksCountDisplay.textContent = 0;
        globalPatsBarElement.style.width = '0%';  // Set progress bar to 0
        return;
    }

    let count = data ? data.count : 0;
    clicksCountDisplay.textContent = count;
    globalPatsBarElement.style.width = (count / 5000) * 100 + '%';  // Update progress bar
}

initClicker();
//button click experiment end

// Function to initialize or update user data in Supabase
async function initializeUser() {
    console.log('Initializing user:', userId);
    let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    console.log('Fetched user data:', userData);
    console.log('Fetch error:', error);

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
        return;
    }

    if (!userData) {
        // User doesn't exist, create new user
        const { data, error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                name: userName,
                username: userUsername,
                pat_count: 0,
                available_pats: 10,
                streak: 0,
                last_login: new Date().toISOString()
            })
            .single();

        if (insertError) {
            console.error('Error creating new user:', insertError);
            return;
        }

        userData = data;
    }

    console.log('Final user data:', userData);

    // Update UI with user data
    updateUIWithUserData(userData);
}


//userNameElement.textContent = userName;


// Function to update UI elements with user data
function updateUIWithUserData(userData) {
    console.log('Updating UI with user data:', userData);
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('pat-count').textContent = userData.pat_count;
    document.getElementById('pats-left').textContent = userData.available_pats;
    document.getElementById('profile-username').textContent = userData.username;
    document.getElementById('profile-total-pats').textContent = userData.pat_count;
    document.getElementById('profile-available-pats').textContent = userData.available_pats;
    document.getElementById('profile-streak').textContent = userData.streak;

    // Update variables
    patCount = userData.pat_count;
    availablePats = userData.available_pats;
    streak = userData.streak;
}

function updateCounters() {
    document.getElementById('pat-count').textContent = patCount;
    document.getElementById('pats-left').textContent = availablePats;
    document.getElementById('multiplier').textContent = `x${multiplier}`;
}

function showMultiplierAlert() {
    const alert = document.createElement('div');
    alert.textContent = 'Multiplier increased!';
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.left = '50%';
    alert.style.transform = 'translateX(-50%)';
    alert.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    alert.style.padding = '10px 20px';
    alert.style.borderRadius = '20px';
    alert.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    alert.style.zIndex = '1000';
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 2000);
}

document.querySelector('.circular-container').addEventListener('click', async function(event) {
    if (availablePats > 0) {
        patCount += multiplier;
        availablePats--;

        // Update Supabase with new pat count and available pats
        const { data, error } = await supabase
            .from('users')
            .update({ pat_count: patCount, available_pats: availablePats })
            .eq('id', userId);

        if (error) {
            console.error('Error updating pat count:', error);
        }

        if (Math.random() < 0.1) {
            multiplier++;
            showMultiplierAlert();
        }

        updateCounters();

    } else {
        alert("You're out of pats! Come back tomorrow for more.");
    }
});

function updateProfileInfo() {
    document.getElementById('profile-username').textContent = userUsername;
    document.getElementById('profile-total-pats').textContent = patCount;
    document.getElementById('profile-available-pats').textContent = availablePats;
    document.getElementById('profile-streak').textContent = streak;
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM content loaded');

    await initializeUser();
    console.log('User initialized');

    updateCounters();
    console.log('Counters updated');

    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');



    // Initially hide all screens except the home screen
    screens.forEach(screen => {
        if (screen.id === 'home') {
            screen.classList.add('active');
        } else {
            screen.classList.remove('active');
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetScreen = this.getAttribute('data-screen');
            console.log('Clicked nav item:', targetScreen);

            // Remove active class from all nav items and add to clicked item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');

            // Hide all screens and show the target screen
            screens.forEach(screen => {
                if (screen.id === targetScreen) {
                    screen.classList.add('active');
                    console.log('Activating screen:', targetScreen);
                } else {
                    screen.classList.remove('active');
                }
            });

            if (targetScreen === 'profile') {
                updateProfileInfo();
            }
        });
    });

    const dailyRewardBtn = document.getElementById('dailyRewardBtn');
    const dailyRewardPopup = document.getElementById('dailyRewardPopup');
    const claimRewardBtn = document.getElementById('claimRewardBtn');

    dailyRewardBtn.addEventListener('click', () => {
        dailyRewardPopup.style.display = 'flex';
    });

    claimRewardBtn.addEventListener('click', async () => {
        dailyRewardPopup.style.display = 'none';
        patCount += 100;
        availablePats += 100;
        
        // Update Supabase with new pat count and available pats
        const { data, error } = await supabase
            .from('users')
            .update({ pat_count: patCount, available_pats: availablePats })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user data after claiming reward:', error);
        }

        updateCounters();
        updateProfileInfo();
    });


    dailyRewardPopup.addEventListener('click', (e) => {
        if (e.target === dailyRewardPopup) {
            dailyRewardPopup.style.display = 'none';
        }
    });

    updateCounters(); 
});
