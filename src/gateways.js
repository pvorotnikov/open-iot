const express = require('express')
const router = express.Router()
const validator = require('validator')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Gateway } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch gateway by id that belongs to a particular user
router.get('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Gateway
    .findById(req.params.id)
    .where('user').eq(req.user._id)
    .then((g) => {
        if (a) {
            let data = {
                id: g.id,
                name: g.name,
                description: g.description,
                created: g.created,
                updated: g.updated,
            }
            res.json({ status: 'ok', data })
        } else {
            res.status(400).json(new ErrorResponse('Gateway not found'))
        }
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

module.exports = router
