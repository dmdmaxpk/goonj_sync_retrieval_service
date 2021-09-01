const express = require('express');
const router = express.Router();
const controller = require('../controllers/BillingStatsController');
const cors = require('cors');

router.route('/rev', cors())
    .get(controller.rev_report)

router.route('/req-count', cors())
    .get(controller.req_count)

router.route('/revenue/stats', cors())
    .get(controller.revenue_stats);

module.exports = router;