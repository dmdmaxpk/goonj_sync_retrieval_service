const express = require('express');
const router = express.Router();
const controller = require('../controllers/SyncCollectionController');

router.route('/collection')
    .post(controller.syncCollection)

module.exports = router;