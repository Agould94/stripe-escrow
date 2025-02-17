require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const escrowRoutes = require('./controllers/escrow-controller')

const app = express();

app.use(express.json());
app.use(cors());

app.use('/escrow', escrowRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
