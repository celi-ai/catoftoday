export function initializeBuyPats(tg) {
    const buyPatsBtn = document.getElementById('buyPatsBtn');
    
    buyPatsBtn.addEventListener('click', () => {
        const patsOptions = [
            { id: 'pats_10', name: '10 Pats', price: 99 },
            { id: 'pats_50', name: '50 Pats', price: 399 },
            { id: 'pats_100', name: '100 Pats', price: 699 }
        ];

        tg.showPopup({
            title: 'Buy More Pats',
            message: 'Choose how many pats you want to buy:',
            buttons: patsOptions.map(option => ({
                id: option.id,
                type: 'buy',
                text: `${option.name} - $${(option.price / 100).toFixed(2)}`,
                params: {
                    product_id: option.id,
                    currency: 'USD',
                    price: option.price
                }
            }))
        }, (buttonId) => {
            if (buttonId) {
                const selectedOption = patsOptions.find(option => option.id === buttonId);
                processPayment(selectedOption);
            }
        });
    });
}

function processPayment(option) {
    // Here you would integrate with your backend to process the payment
    // and update the user's available pats
    console.log(`Processing payment for ${option.name}`);
    // After successful payment:
    // 1. Update user's available pats in Firebase
    // 2. Show a success message
    // 3. Update the UI to reflect the new pat count
}