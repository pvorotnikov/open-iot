const express = require('express')
const router = express.Router()
const { logger } = require('./lib')
const { Application, Gateway, Rule } = require('./models')

/* ================================
 * App middleware
 * ================================
 */

// authenticate user
router.post('/:appId/:gatewayId/:any', (req, res, next) => {
    res.json({})
})

module.exports = router
