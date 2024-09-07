export function initializeInviteFriend(tg) {
    const inviteFriendBtn = document.getElementById('inviteFriendBtn');
    
    inviteFriendBtn.addEventListener('click', () => {
        const inviteLink = "https://t.me/CatOfTodayBot?start=" + generateInviteCode();
        
        tg.showPopup({
            title: 'Invite a Friend',
            message: 'Share this link with your friend:',
            buttons: [
                {id: 'copy', type: 'default', text: 'Copy Link'},
                {id: 'share', type: 'default', text: 'Share Link'}
            ]
        }, (buttonId) => {
            if (buttonId === 'copy') {
                tg.copyToClipboard(inviteLink);
                tg.showAlert('Invite link copied to clipboard!');
            } else if (buttonId === 'share') {
                tg.shareUrl(inviteLink);
            }
        });
    });
}

function generateInviteCode() {
    // Generate a unique invite code for the user
    // This could be a combination of the user's ID and a timestamp
    return 'INVITE_' + Date.now();
}