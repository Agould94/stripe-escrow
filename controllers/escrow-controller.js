const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');
const escrowsFile = path.join(__dirname, '../db/escrows.json');

const getEscrows = () => {
    if (!fs.existsSync(escrowsFile)) return [];
    return JSON.parse(fs.readFileSync(escrowsFile));
};

const saveEscrows = (escrows) => {
    fs.writeFileSync(escrowsFile, JSON.stringify(escrows, null, 2));
};

router.get('/get-escrows', async (req, res) => {
    try {
        const escrows = getEscrows();
        res.json(escrows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create an escrow session
router.post('/create-escrow-session', async (req, res) => {
    try {
        const { amount, clientEmail, freelancerEmail } = req.body;

        // Load users from JSON
        const users = require('../db/users.json');

        // Find the client
        const client = users.clients.find(u => u.email === clientEmail);
        if (!client || !client.stripeCustomerId) {
            return res.status(400).json({ error: "Client not found or not connected to Stripe" });
        }

        // Find the freelancer
        const freelancer = users.freelancers.find(u => u.email === freelancerEmail);
        if (!freelancer || !freelancer.stripeAccountId) {
            return res.status(400).json({ error: "Freelancer not found or not connected to Stripe" });
        }

        // Get the client's default payment method
        const paymentMethods = await stripe.paymentMethods.list({
            customer: client.stripeCustomerId,
            type: 'card',
        });

        if (paymentMethods.data.length === 0) {
            return res.status(400).json({ error: "Client does not have a valid payment method" });
        }

        const paymentMethodId = paymentMethods.data[0].id; // Use the first available payment method

        // Create a PaymentIntent with the client as the payer
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert dollars to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            capture_method: 'manual', // HOLD funds instead of charging immediately
            confirm: true, // Automatically confirm the payment intent
            customer: client.stripeCustomerId,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never' // Ensures only card payments are used
            },
            metadata: {
                freelancerEmail,
                clientEmail,
                amount,
            }
        });

        // Store escrow details
        const escrows = getEscrows();
        const newEscrow = {
            id: paymentIntent.id,
            amount,
            clientEmail,
            freelancerEmail,
            status: "Pending",
            autoReleaseTime: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        escrows.push(newEscrow);
        saveEscrows(escrows);

        res.json({ message: "Escrow session created", paymentIntentId: paymentIntent.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




router.post('/partial-release', async (req, res) => {
    try {
        const { paymentIntentId, amount } = req.body;

        // Retrieve escrow entry
        let escrows = getEscrows();
        let escrow = escrows.find(e => e.id === paymentIntentId);
        if (!escrow) return res.status(404).json({ error: "Escrow not found" });

        // Find freelancer
        const users = require('../db/users.json');
        const freelancer = users.find(u => u.email === escrow.freelancerEmail);
        if (!freelancer || !freelancer.stripeAccountId) {
            return res.status(400).json({ error: "Freelancer not found or not connected to Stripe" });
        }

        // Send **partial** payment to freelancer
        const transfer = await stripe.transfers.create({
            amount: amount * 100, // Convert to cents
            currency: "usd",
            destination: freelancer.stripeAccountId
        });

        res.json({ message: 'Partial funds released!', transfer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




router.post('/release-funds', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: "Payment Intent ID is required" });
        }

        // Retrieve the PaymentIntent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (!paymentIntent) {
            return res.status(404).json({ error: "PaymentIntent not found in Stripe" });
        }

        if (paymentIntent.status !== "requires_capture") {
            return res.status(400).json({ 
                error: `This PaymentIntent cannot be captured because it has a status of ${paymentIntent.status}.`
            });
        }

        // Capture the PaymentIntent (release the funds)
        await stripe.paymentIntents.capture(paymentIntentId);

        // Retrieve escrow entry
        let escrows = getEscrows();
        let escrow = escrows.find(e => e.id === paymentIntentId);
        if (!escrow) return res.status(404).json({ error: "Escrow not found" });

        // Find Freelancer
        const users = require('../db/users.json');
        const freelancer = users.freelancers.find(u => u.email === escrow.freelancerEmail);
        if (!freelancer || !freelancer.stripeAccountId) {
            return res.status(400).json({ error: "Freelancer not found or not connected to Stripe" });
        }

        // Transfer funds to the Freelancer
        const transfer = await stripe.transfers.create({
            amount: escrow.amount * 100,
            currency: "usd",
            destination: freelancer.stripeAccountId
        });

        // Update escrow status
        escrows = escrows.map(e => e.id === paymentIntentId ? { ...e, status: "Released" } : e);
        saveEscrows(escrows);

        res.json({ message: 'Funds released!', transfer });
    } catch (error) {
        console.error("Release funds error:", error);
        res.status(500).json({ error: error.message });
    }
});


router.post('/rescind-funds', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        // Simulate waiting for freelancer's approval
        res.json({ message: "Rescind request sent to freelancer for approval." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const autoReleaseFunds = async () => {
    const escrows = getEscrows();
    const now = Date.now();

    for (let escrow of escrows) {
        if (escrow.status === "Pending" && escrow.autoReleaseTime < now) {
            try {
                await stripe.paymentIntents.capture(escrow.id);
                escrow.status = "Auto-Released";
            } catch (error) {
                console.error(`Failed to auto-release: ${error.message}`);
            }
        }
    }

    saveEscrows(escrows);
};

// Run auto-release every hour
setInterval(autoReleaseFunds, 60 * 60 * 1000);
module.exports = router;
