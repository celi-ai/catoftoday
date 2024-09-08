import { getDatabase, ref, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-functions.js";

export function initializeBuyPats(tg, userId) {
    const buyPatsBtn = document.getElementById('buyPatsBtn');
    const db = getDatabase();
    const functions = getFunctions();
    const generateInvoice = httpsCallable(functions, 'generateInvoice');

    buyPatsBtn.addEventListener('click', () => {
        const patsOptions = [
            { id: 'pats_10', name: '10 Pats', price: 100 }, // 100 Stars
            { id: 'pats_50', name: '50 Pats', price: 450 }, // 450 Stars
            { id: 'pats_100', name: '100 Pats', price: 800 } // 800 Stars
        ];

        tg.showPopup({
            title: 'Buy More Pats',
            message: 'Choose how many pats you want to buy:',
            buttons: patsOptions.map(option => ({
                id: option.id,
                type: 'default',
                text: `${option.name} - ${option.price} Stars`
            }))
        }, (buttonId) => {
            if (buttonId) {
                const selectedOption = patsOptions.find(option => option.id === buttonId);
                initiatePayment(selectedOption);
            }
        });
    });

    function initiatePayment(option) {
        const patsAmount = parseInt(option.name.split(' ')[0]);
        generateInvoice({
            title: option.name,
            description: `Purchase ${patsAmount} pats for your cat`,
            amount: option.price,
            patsAmount: patsAmount
        })
        .then((result) => {
            if (result.data.success) {
                tg.openInvoice(result.data.invoiceLink, (status) => {
                    if (status === 'paid') {
                        processSuccessfulPayment(option, patsAmount);
                    } else {
                        console.log('Payment not completed');
                        tg.showAlert('Payment was not completed. Please try again or contact support if the problem persists.');
                    }
                });
            } else {
                console.error('Failed to create invoice:', result.data.error);
                tg.showAlert('There was an error creating your invoice. Please try again later.');
            }
        })
        .catch((error) => {
            console.error('Error calling generateInvoice:', error);
            if (error.code === 'unauthenticated') {
                tg.showAlert('You need to be logged in to make a purchase. Please log in and try again.');
            } else {
                tg.showAlert('An unexpected error occurred. Please try again or contact support.');
            }
        });
    }

    function processSuccessfulPayment(option, patsAmount) {
        const userRef = ref(db, `users/${userId}`);
        runTransaction(userRef, (userData) => {
            if (userData) {
                userData.availablePats = (userData.availablePats || 0) + patsAmount;
                return userData;
            }
            return null;
        }).then(() => {
            tg.showAlert(`Successfully purchased ${patsAmount} pats!`);
        }).catch((error) => {
            console.error('Error updating user data:', error);
            tg.showAlert('Purchase successful, but there was an error updating your pats. Please contact support.');
        }); 
    }
}