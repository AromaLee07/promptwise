const express = require('express');
const router = express.Router();
const subscribeController = require('../controllers/subscribeController');





// api
// router.post('/create', subscribeControllCharge);
router.post('/create', subscribeController.createSubscription);
// router.post('/payment', subscribeController.createPaymentIntent);
router.post('/confirm-payment', subscribeController.confirmPayment)


module.exports = router;