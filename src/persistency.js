const express = require('express')
const { logger, responses, auth, exchange } = require('./lib')
const { Message } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/persistency', router)

    router.get('/:appId/*', auth.basic(), async (req, res, next) => {

        try {

            const key = req.application.key
            const secret = req.application.secret
            const appId = req.params.appId
            const topic = req.params['0']

            res.json(new SuccessResponse([]))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        }

    })

} // module.exports

