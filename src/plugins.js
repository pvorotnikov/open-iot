const express = require('express')
const validator = require('validator')
const unzip = require('unzip')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Plugin } = require('./models')
const { SuccessResponse, ErrorResponse } = responses
const util = require('util')
const fs = require('fs')
const hat = require('hat')

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/plugins', router)

    // fetch all available plugins and their statuses
    router.get('/', auth.protect(ACCESS_LEVEL.ADMIN), (req, res, next) => {

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
    router.post('/', auth.protect(ACCESS_LEVEL.ADMIN), async (req, res, next) => {

        const pluginSource = __dirname + '/temp'
        await installPlugin(req.body, pluginSource)
        const pluginName = await validatePlugin()

        let plugin = new Plugin({
            name: 'bla',
            description: 'bla',
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
     * @param {String} buf buffer with the file contents
     * @param {String} destination where to put the unzipped content
     * @return {Promise<>}
     */
    function installPlugin(buf, destination) {
        return new Promise((fulfill, reject) => {

            let writeFile = util.promisify(fs.writeFile)
            let uniqueId = hat(32)
            let zipFile = `${destination}/${uniqueId}.zip`

            writeFile(zipFile, buf)
            .then(() => {

                const readStream = fs.createReadStream(zipFile)
                const writeStrem = unzip.Extract({ path: `${destination}/${uniqueId}` })

                writeStrem.on('close', () => {
                    logger.info('-> Waiting for service to restart...')
                    fulfill()
                })

                writeStrem.on('error', err => {
                    reject(err)
                })

                readStream.pipe(writeStrem)

            })
            .catch(err => {
                reject(err)
            })

        })
    }

    function validatePlugin(pluginSource) {
        return new Promise((fulfill,  reject) => {

            let name = 'com.example.plugin1'
            let description = 'Plugin 1'

            fulfill(name, description)

        })
    }

} // module.exports
