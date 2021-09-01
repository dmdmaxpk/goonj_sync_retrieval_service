const express = require('express');
const router = express.Router();
const controller = require('../controllers/BillingStatsController');

router.route('/get_expire_history').get(controller.getExpiryHistory)

module.exports = router;
