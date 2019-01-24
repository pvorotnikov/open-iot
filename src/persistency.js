const express = require('express')
const mongoose = require('mongoose')
const models = require('./models')
const { logger, responses, auth, exchange } = require('./lib')
const { SuccessResponse, ErrorResponse, HTTPError } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/persistency', router)

    router.get('/:appId', auth.basic(), async (req, res, next) => {

        try {

            const key = req.application.key
            const secret = req.application.secret
            const appId = req.params.appId

            const messages = await models.Message.find().where('application').eq(appId)
            const data = messages.map(m => {

                // form payload
                let payload = m.payload.toString('base64')
                try {
                    payload = JSON.parse(m.payload.toString())
                } catch (err) {
                    logger.debug('Payload is not JSON. Returning base64 encoded buffer')
                }

                return {
                    topic: m.topic,
                    application: m.application,
                    gateway: m.gateway,
                    payload: payload,
                    created: m.created,
                    updated: m.updated,
                }
            })
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        }

    })

    router.get('/:appId/*', auth.basic(), async (req, res, next) => {

        try {

            const key = req.application.key
            const secret = req.application.secret
            const appId = req.params.appId
            const topic = req.params['0']

            // analyze topic and perform different tasks
            const [ gwId, ...topicParts ] = topic.split('/')
            let topicName, query

            // :appId/:gwId/topic
            if (mongoose.Types.ObjectId.isValid(gwId)) {
                if (!topicParts.length) {
                    query = models.Message.find()
                            .where('application').eq(appId)
                            .where('gateway').eq(gwId)
                } else {
                    topicName = topicParts.join('/')
                    query = models.Message.find()
                            .where('application').eq(appId)
                            .where('gateway').eq(gwId)
                            .where('topic').eq(topicName)
                }

            // :appId/topic1/topic2
            } else if (topicParts && topicParts.length) {
                topicName = gwId + '/' + topicParts.join('/')
                query = models.Message.find()
                        .where('application').eq(appId)
                        .where('gateway').eq(null)
                        .where('topic').eq(topicName)

            // :appId/topic
            } else {
                topicName = gwId
                query = models.Message.find()
                        .where('application').eq(appId)
                        .where('gateway').eq(null)
                        .where('topic').eq(topicName)
            }

            const messages = await query
            const data = messages.map(m => {

                // form payload
                let payload = m.payload.toString('base64')
                try {
                    payload = JSON.parse(m.payload.toString())
                } catch (err) {
                    logger.debug('Payload is not JSON. Returning base64 encoded buffer')
                }

                return {
                    topic: m.topic,
                    application: m.application,
                    gateway: m.gateway,
                    payload: payload,
                    created: m.created,
                    updated: m.updated,
                }
            })
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        }

    })

} // module.exports

