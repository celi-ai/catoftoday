window.initializeBuyPats = function(tg) {
    const buyPatsBtn = document.getElementById('buyPatsBtn');
    
    buyPatsBtn.addEventListener('click', () => {
        const patsOptions = [
            { id: 'pats_10', name: '10 Pats', amount: 10, price: 99 },
            { id: 'pats_50', name: '50 Pats', amount: 50, price: 399 },
            { id: 'pats_100', name: '100 Pats', amount: 100, price: 699 }
        ];
        tg.showPopup({
            title: 'Buy More Pats',
            message: 'Choose how many pats you want to buy:',
            buttons: patsOptions.map(option => ({
                id: option.id,
                type: 'default',
                text: `${option.name} - ${option.price / 100} Stars`
            }))
        }, async (buttonId) => {
            if (buttonId) {
                const selectedOption = patsOptions.find(option => option.id === buttonId);
                await processPayment(tg, selectedOption);
            }
        });
    });
}

async function processPayment(tg, option) {
    try {
        // Call your Cloud Function to generate the invoice
        const response = await fetch('https://us-central1-catoftoday-e2451.cloudfunctions.net/generateInvoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: option.amount }),
        });
        if (!response.ok) {
            throw new Error('Failed to generate invoice');
        }
        const { invoiceLink } = await response.json();
        tg.openInvoice(invoiceLink, (status) => {
            if (status === 'paid') {
                // Update user's available pats
                const db = firebase.database();
                const userRef = db.ref(`users/${tg.initDataUnsafe.user.id}`);
                userRef.transaction((userData) => {
                    if (userData) {
                        userData.availablePats = (userData.availablePats || 0) + option.amount;
                        return userData;
                    }
                    return null;
                });
                // Update UI
                const availablePatsElement = document.getElementById('availablePats');
                const currentPats = parseInt(availablePatsElement.textContent);
                animateValue(availablePatsElement, currentPats, currentPats + option.amount, 300);
                tg.showAlert('Payment successful! Your pats have been added.');
            } else {
                tg.showAlert('Payment was not completed.');
            }
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        tg.showAlert('An error occurred while processing your payment. Please try again later.');
    }
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