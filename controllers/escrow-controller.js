const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


router.get('/get-escrows', async (req, res) => {
    try {
        // Mock data for now (replace with DB call)
        const escrows = [
            {
                id: "1",
                amount: 500,
                status: "Pending",
                paymentIntentId: "pi_123456",
                autoReleaseTime: new Date().getTime() + 1000 * 60 * 60 * 24 * 7, // 7 days from now
            }
        ];
        res.json(escrows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create an escrow session
router.post('/create-escrow-session', async (req, res) => {
    try {
        const { amount, clientEmail, freelancerId } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: clientEmail,
            mode: 'payment',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
            payment_intent_data: {
                transfer_data: { destination: freelancerId },
                capture_method: 'manual',
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Escrow Payment' },
                        unit_amount: amount * 100,
                    },
                    quantity: 1,
                },
            ],
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Release funds from escrow
router.post('/release-funds', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        res.json({ message: 'Funds released!', paymentIntent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Auto-release funds after timeout
const autoReleaseFunds = async (paymentIntentId) => {
    setTimeout(async () => {
        try {
            await stripe.paymentIntents.capture(paymentIntentId);
            console.log(`Auto-released funds for Payment Intent: ${paymentIntentId}`);
        } catch (error) {
            console.error(`Failed to auto-release funds: ${error.message}`);
        }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
};

module.exports = router;
