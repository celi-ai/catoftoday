import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sleghazbpzgynnzriozz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZWdoYXpicHpneW5uenJpb3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4ODc5MDQsImV4cCI6MjA0MTQ2MzkwNH0.ltjHJAEnQBYko4Om6pwQRU5xp6QsQfkYyZwEBKG71xA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


let patCount = 281;
let progress = 28;
const totalProgress = 5000;
let multiplier = 1;
let catMood = 'content';

function updateCounters() {
    document.getElementById('pat-count').textContent = patCount;
    document.getElementById('progress-current').textContent = progress;
    document.getElementById('progress-total').textContent = totalProgress;
    document.getElementById('multiplier').textContent = multiplier;
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateCatMood() {
    const moods = ['sleepy', 'content', 'playful', 'excited', 'blissful'];
    catMood = moods[Math.floor(Math.random() * moods.length)];
    const catImage = document.querySelector('.cat-image');
    catImage.style.backgroundColor = `var(--mood-${catMood})`;
    document.getElementById('current-mood').textContent = catMood;
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

document.querySelector('.circular-container').addEventListener('click', function(event) {
    patCount += multiplier;
    progress += multiplier;

    animateValue(document.getElementById('pat-count'), patCount - multiplier, patCount, 300);
    animateValue(document.getElementById('progress-current'), progress - multiplier, progress, 300);

    if (Math.random() < 0.1) {
        multiplier++;
        showMultiplierAlert();
    }

    updateCatMood();
    updateCounters();
});

function updateProfileInfo() {
    document.getElementById('profile-username').textContent = 'CatLover123';
    document.getElementById('profile-total-pats').textContent = patCount;
    document.getElementById('profile-available-pats').textContent = '200';
    document.getElementById('profile-streak').textContent = '5';
}

document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
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
        updateCounters();
        updateProfileInfo();
    });

    dailyRewardPopup.addEventListener('click', (e) => {
        if (e.target === dailyRewardPopup) {
            dailyRewardPopup.style.display = 'none';
        }
    });
});

updateCounters();
updateCatMood();