const express = require('express')
const validator = require('validator')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Module, Integration, PipelineStep } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/integrations', router)

    /**
     * Fetch all integrations.
     */
    router.get('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

        Integration.find()
        .where('user').eq(req.user._id)
        .then((integrations) => {
            let data = integrations.map(i => ({
                id: i._id,
                topic: i.topic,
                pipeline: i.pipeline.map(s => ({
                    module: s.module,
                    arguments: s.arguments
                })),
                created: i.created,
                updated: i.updated,
            }))
            res.json(new SuccessResponse(data))
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

    /**
     * Create new integration
     */
    router.post('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

        const { topic, pipeline } = req.body

        if (!topic || validator.isEmpty(topic)) {
            return res.status(400).json(new ErrorResponse('You need to specify a topic for this integration'))
        }

        let integrationPipeline = pipeline.map(step => {
            return new PipelineStep({
                module: step.module,
                arguments: step.arguments,
            })
        })
        let integration = new Integration({ user: req.user._id, topic, pipeline: integrationPipeline })
        integration.save()
        .then(result => {
            let data = {
                id: result._id,
                topic: result.topic,
                pipeline: result.pipeline.map(s => ({
                    module: s.module,
                    arguments: s.arguments
                })),
                created: result._id,
                updated: result.updated,
            }
            res.json(new SuccessResponse(data))
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

}
