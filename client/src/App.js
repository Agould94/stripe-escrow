import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [amount, setAmount] = useState('');

    const handlePayment = async () => {
        const response = await fetch('http://localhost:5001/escrow/create-escrow-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, clientEmail: "test@example.com", freelancerId: "acct_test1234" }),
        });
        const { sessionId } = await response.json();
        stripe.redirectToCheckout({ sessionId });
    };

    return (
        <div>
            <h2>Deposit into Escrow</h2>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={handlePayment}>Pay</button>
        </div>
    );
}

export default function App() {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm />
        </Elements>
    );
}
