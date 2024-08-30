const express = require('express');
const router = express.Router();



const stripeWebhookController = require('../controllers/stripeWebhookController');

// 使用 raw body parser 为 Stripe webhook
router.post('/webhook', express.raw({type: 'application/json'}), stripeWebhookController.handleWebhook);

module.exports = router;
