const express = require('express')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Module } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/modules', router)

    // fetch all modules
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

    // enable/disable module (edit module)
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
