
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sleghazbpzgynnzriozz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInNsZWdoYXpicHpneW5uenJpb3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4ODc5MDQsImV4cCI6MjA0MTQ2MzkwNH0.ltjHJAEnQBYko4Om6pwQRU5xp6QsQfkYyZwEBKG71xA';
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
        .upsert({ user_id: 'current_user', pats_count: newCount })  // Replace with actual user logic

    if (error) {
        console.error('Error updating pat count:', error);
    }
}

function updateCounters() {
    document.getElementById('pat-count').textContent = patCount;
    document.getElementById('progress-current').textContent = progress;
    document.getElementById('progress-total').textContent = totalProgress;
    document.getElementById('multiplier').textContent = multiplier;
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

            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');

            screens.forEach(screen => {
                if (screen.id === targetScreen) {
                    screen.classList.add('active');
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

    // Animate the patCount and progress
    animateValue(document.getElementById('pat-count'), patCount - multiplier, patCount, 300);
    animateValue(document.getElementById('progress-current'), progress - multiplier, progress, 300);

    // Randomly increase multiplier
    if (Math.random() < 0.1) {
        multiplier++;
        showMultiplierAlert();
    }

    updateCounters();

    // Update the patCount in Supabase after each interaction
    await updatePatCount(patCount);
});

