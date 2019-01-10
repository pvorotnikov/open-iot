const mongoose = require('mongoose')
const express = require('express')
const { logger, responses, auth, utils, constants } = require('./lib')
const { ACCESS_LEVEL, Module, Integration } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError, } = responses

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
            res.json(new SuccessResponse(data))
        })
        .catch((err) => {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
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
        let updtedModule = null

        Module.findOne({ _id: req.params.moduleId })
        .then(m => {
            if (!m) throw new HTTPError(`Invalid module: ${req.params.moduleId}`, 404)
            m.status = status
            m.updated = Date.now()
            updtedModule = m
            return m.save()
        })
        .then(m => Integration.find({ 'pipeline.module': new mongoose.mongo.ObjectId(m._id) }))
        .then(integrations => {
            logger.info(`Found ${integrations.length} integrations that involve module ${req.params.moduleId}`)
            let integrationPromises = integrations.map(i => {
                i.pipeline.forEach(s => {
                    if ('disabled' === status && s.module.toString() === updtedModule._id.toString()) {
                        logger.info(`Disabling pipeline step ${s._id}`)
                        s.status = 'disabled'
                        s.updated = Date.now()
                    }
                })
                return i.save()
            })
            return Promise.all(integrationPromises)
        })
        .then(() => {
            if ('enabled' === updtedModule.status) {
                process.emit(constants.EVENTS.MODULE_ENABLE, updtedModule._id)
            } else if ('disabled' === updtedModule.status) {
                process.emit(constants.EVENTS.MODULE_DISABLE, updtedModule._id)
            }
        })
        .then(() => {
            let data = {
                id: updtedModule._id,
                name: updtedModule.name,
                description: updtedModule.description,
                meta: updtedModule.meta,
                status: updtedModule.status,
            }
            res.json(new SuccessResponse(data))
        })
        .catch(err => {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        })

    })

}
