const express = require('express')
const router = express.Router()
const validator = require('validator')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Application } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch all apps that belong to the user
router.get('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Application.find().where({ user: req.user._id })
    .then((apps) => {
        res.json({ status: 'ok', data: apps })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

module.exports = router
