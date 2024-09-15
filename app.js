import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sleghazbpzgynnzriozz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZWdoYXpicHpneW5uenJpb3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4ODc5MDQsImV4cCI6MjA0MTQ2MzkwNH0.ltjHJAEnQBYko4Om6pwQRU5xp6QsQfkYyZwEBKG71xA';  // Replace with your actual key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let patCount = 0;
let progress = 28;
const totalProgress = 5000;
let multiplier = 1;

// Function to fetch patCount from Supabase for the current user
async function fetchPatCount() {
    const { data, error } = await supabase
        .from('user_pats')
        .select('pats_count')
        .eq('user_id', 'current_user')  // Replace with actual user logic
        .single();

    if (error) {
        console.error('Error fetching pat count:', error);
        return;
    }

    if (data) {
        patCount = data.pats_count;
        updateCounters();
    }
}

// Function to update patCount in Supabase
async function updatePatCount(newCount) {
    const { error } = await supabase
        .from('user_pats')
        .upsert({ user_id: 'current_user', pats_count: newCount });  // Replace with actual user logic

    if (error) {
        console.error('Error updating pat count:', error);
    }
}

function updateCounters() {
    const patCounter = document.getElementById('pat-count');
    const multiplierDisplay = document.getElementById('multiplier');
    const patsLeftDisplay = document.getElementById('pats-left');

    if (patCounter) {
        patCounter.textContent = patCount;
    }
    if (multiplierDisplay) {
        multiplierDisplay.textContent = `x${multiplier}`;
    }
    if (patsLeftDisplay) {
        patsLeftDisplay.textContent = patCount;
    }
}

function updateProfileInfo() {
    document.getElementById('profile-username').textContent = 'CatLover123';
    document.getElementById('profile-total-pats').textContent = patCount;
    document.getElementById('profile-available-pats').textContent = '200';
    document.getElementById('profile-streak').textContent = '5';
}

document.addEventListener('DOMContentLoaded', function () {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetScreen = this.getAttribute('data-screen');

            // Remove active class from all nav items and screens
            navItems.forEach(navItem => navItem.classList.remove('active'));
            screens.forEach(screen => screen.classList.remove('active'));

            // Add active class to clicked nav item and corresponding screen
            this.classList.add('active');
            document.getElementById(targetScreen).classList.add('active');
        });
    });

    const dailyRewardBtn = document.getElementById('dailyRewardBtn');
    const dailyRewardPopup = document.getElementById('dailyRewardPopup');
    const claimRewardBtn = document.getElementById('claimRewardBtn');

    dailyRewardBtn.addEventListener('click', () => {
        dailyRewardPopup.style.display = 'flex';
    });

    claimRewardBtn.addEventListener('click', () => {
        dailyRewardPopup.style.display = 'none';
        patCount += 20;
        updatePatCount(patCount);  // Update Supabase with new pat count
        updateCounters();
        updateProfileInfo();
    });

    dailyRewardPopup.addEventListener('click', (e) => {
        if (e.target === dailyRewardPopup) {
            dailyRewardPopup.style.display = 'none';
        }
    });

    // Fetch initial pat count when the page loads
    fetchPatCount();
    updateCounters();
});

// Pat interaction logic
document.querySelector('.circular-container').addEventListener('click', async function(event) {
    patCount += multiplier;
    progress += multiplier;

    // Animate the patCount and progress in the UI
    const patCounter = document.getElementById('pat-count');
    const progressCounter = document.getElementById('progress-current');
    if (patCounter) {
        patCounter.textContent = patCount;
    }
    if (progressCounter) {
        progressCounter.textContent = progress;
    }

    // Randomly increase multiplier
    if (Math.random() < 0.1) {
        multiplier++;
        const multiplierDisplay = document.getElementById('multiplier');
        if (multiplierDisplay) {
            multiplierDisplay.textContent = `x${multiplier}`;
        }
    }

    updateCounters();

    // Update the patCount in Supabase after each interaction
    await updatePatCount(patCount);
});
