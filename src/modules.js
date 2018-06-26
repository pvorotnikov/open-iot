const express = require('express')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Module } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/modules', router)

    /**
     * Fetch all modules. This returns a list of available modules with their
     * respective status. This is to be used by any user-level calls to obtain
     * a list of the modules with their ids.
     */
    router.get('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

        Module.find()
        .then((modules) => {
            let data = modules.map(m => ({
                id: m._id,
                name: m.name,
                description: m.description,
                meta: m.meta,
                status: m.status,
            }))
            res.json({ status: 'ok', data })
        })
        .catch((err) => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

    /**
     * Enable/disable module (edit module). This performs global module disable
     * i.e. it marks the module as "disabled" in the DB and also marks any PipelineStep
     * that involves the module as "disabled". This effectively causes the step to not
     * getting called during pipeline execution.
     */
    router.put('/:moduleId', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

        const { status } = req.body

        Module.findOne({ _id: req.params.moduleId })
        .then(m => {
            if (!m) throw new Error(`Invalid module: ${req.params.moduleId}`)
            m.status = status
            m.updated = Date.now()
            return m.save()
        })
        .then(m => {
            let data = {
                id: m._id,
                name: m.name,
                description: m.description,
                meta: m.meta,
                status: status,
            }
            res.json(new SuccessResponse(data))
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

}
