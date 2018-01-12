const express = require('express')
const router = express.Router()
const validator = require('validator')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Setting } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch all settings
router.get('/', auth.protect(ACCESS_LEVEL.ADMIN), (req, res, next) => {

    Setting.find()
    .then(settings => {
        let data = settings.map(s => ({
            key: s.key,
            value: s.value,
            modified: s.dateModified
        }))
        res.json({ status: 'ok', data })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

module.exports = router
