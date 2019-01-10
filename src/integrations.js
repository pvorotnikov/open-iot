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
    router.get('/', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {
            const integrations = await Integration.find()
            .where('user').eq(req.user._id)

            const data = integrations.map(i => ({
                id: i._id,
                topic: i.topic,
                pipeline: i.pipeline.map(s => ({
                    module: s.module,
                    arguments: s.arguments,
                    status: s.status,
                })),
                status: i.status,
                created: i.created,
                updated: i.updated,
            }))
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(500).json(new ErrorResponse(err.message))
        }
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
                    arguments: s.arguments,
                    status: s.status,
                })),
                status: result.status,
                created: result.created,
                updated: result.updated,
            }
            res.json(new SuccessResponse(data))
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

    /**
     * Delete integration
     */
    router.delete('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

        Integration.findById(req.params.id)
        .where('user').eq(req.user._id)
        .then(integration => integration.remove())
        .then(() => {
            res.json(new SuccessResponse())
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

    /**
     * Enable/disable integration
     */
    router.put('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

        const { status } = req.body

        Integration.findById(req.params.id)
        .where('user').eq(req.user._id)
        .then(integration => {
            if (!integration) throw new Error(`Invalid integration: ${req.params.id}`)
            integration.status = status
            integration.updated = Date.now()
            return integration.save()
        })
        .then(result => {
            let data = {
                id: result._id,
                topic: result.topic,
                pipeline: result.pipeline.map(s => ({
                    module: s.module,
                    arguments: s.arguments,
                    status: s.status,
                })),
                status: status,
                created: result.crated,
                updated: result.updated,
            }
            res.json(new SuccessResponse(data))
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })


    /**
     * Enable/disable integration step
     */
    router.put('/:integrationId/:stepIndex', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

        const { status } = req.body
        const stepIndex = parseInt(req.params.stepIndex)

        Integration.findById(req.params.integrationId)
        .where('user').eq(req.user._id)
        .then(async integration => {
            if (!integration) throw new Error(`Invalid integration: ${req.params.integrationId}`)
            if (!integration.pipeline[stepIndex]) throw new Error('Invalid pipeline step')
            if ('missing' === integration.pipeline[stepIndex].status) throw new Error('Cannot change the status of steps involving a missing module')

            if ('enabled' === status) {
                let module = await Module.findById(integration.pipeline[stepIndex].module)
                if ('enabled' !== module.status) throw new Error('The module involving this step is not enabled')
            }

            integration.pipeline[stepIndex].status = status
            integration.pipeline[stepIndex].updated = Date.now()
            return integration.save()
        })
        .then(result => {
            let data = {
                id: result._id,
                topic: result.topic,
                pipeline: result.pipeline.map((s, i) => ({
                    module: s.module,
                    arguments: s.arguments,
                    status: i === stepIndex ? status : s.status,
                })),
                status: result.status,
                created: result.crated,
                updated: result.updated,
            }
            res.json(new SuccessResponse(data))
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

}
