export function initializeTwitterShare(tg) {
    const shareTwitterBtn = document.getElementById('shareTwitterBtn');
    
    shareTwitterBtn.addEventListener('click', () => {
        const tweetText = encodeURIComponent("I'm patting cats and loving it! Join me on Cat of Today!");
        const tweetUrl = encodeURIComponent("https://t.me/CatOfTodayBot"); // Replace with your actual bot URL
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;
        
        tg.openLink(twitterUrl);
        
        // After sharing, you might want to reward the user with extra pats
        rewardUserForSharing();
    });
}

function rewardUserForSharing() {
    // Implement logic to give the user extra pats for sharing
    console.log("Rewarding user for sharing on Twitter");
    // Update Firebase with new pat count
    // Update UI to reflect new pat count
}