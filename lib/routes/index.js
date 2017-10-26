'use strict';

const express = require('express');
const router = express.Router();
const explorer = require('../controllers/explorer');

/* GET home page. */
router.get('/', explorer.index);
router.get('/refresh', explorer.xhrRefresh);

module.exports = router;