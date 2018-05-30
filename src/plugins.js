const express = require('express')
const validator = require('validator')
const unzip = require('unzip')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Plugin } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/plugins', router)

    // fetch all available plugins and their statuses
    router.get('/', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

        Plugin.find()
        .then(plugins => {
            let data = plugins.map(p => ({
                id: p._id,
                name: p.name,
                description: p.description,
                enabled: p.enabled,
            }))
            res.json({ status: 'ok', data })
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })

    /**
     * Upload a new plugin. This handler accept multipart
     */
    router.post('/', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

        if (!req.body.name || validator.isEmpty(req.body.name)) {
            return res.status(400).json(new ErrorResponse('name is required'))
        }

        if (!req.body.description || validator.isEmpty(req.body.description)) {
            return res.status(400).json(new ErrorResponse('description is required'))
        }

        let plugin = new Plugin({
            name: req.body.name,
            description: req.body.description,
            enabled: false,
        })
        plugin.save()
        .then(plugin => {
            let data = {
                id: plugin._id,
                name: plugin.name,
                description: plugin.description,
                enabled: plugin.enabled,
            }
            res.json({ status: 'ok', data })
        })
        .catch(err => {
            res.status(500).json(new ErrorResponse(err.message))
        })

    })


    /**
     * Perform plugin installation. Essentially this is unzipping the
     * plugin in a directory that is named after the plugin name.
     * @param {String} zipFile path to the plugin zip file
     * @param {String} destination where to put the unzipped content
     * @return {Promise<>}
     */
    function installPlugin(zipFile, destination) {
        return new Promise((fulfill, reject) => {

            const readStream = fs.createReadStream(zipFile)
            const writeStrem = unzip.Extract({ path: destination })

            writeStrem.on('close', () => {
                logger.info('-> Waiting for service to restart...')
                fulfill()
            })

            writeStrem.on('error', err => {
                reject(err)
            })

            readStream.pipe(writeStrem)
        })
    }

} // module.exports
