const express = require('express')
const validator = require('validator')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Plugin } = require('./models')
const { SuccessResponse, ErrorResponse } = responses
const util = require('util')
const fs = require('fs')
const hat = require('hat')
const AdmZip = require('adm-zip')

const TEMP_DIR = __dirname + '/temp'
if (!fs.existsSync(TEMP_DIR)){
    fs.mkdirSync(TEMP_DIR);
}

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

        const pluginSource = TEMP_DIR
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
     * @param {Buffer} buf buffer with the file contents
     * @param {String} destination where to put the unzipped content
     * @return {Promise<>}
     */
    async function installPlugin(buf, destination) {
        let writeFile = util.promisify(fs.writeFile)
        let uniqueId = hat(32)
        let zipFile = `${destination}/${uniqueId}.zip`

        await writeFile(zipFile, buf)

        const zip = new AdmZip(zipFile)
        zip.extractAllTo(`${destination}/${uniqueId}`, true) // overwrite=True
        logger.info('-> Waiting for service to restart...')
    }

    function validatePlugin(pluginSource) {
        return new Promise((fulfill,  reject) => {

            let name = 'com.example.plugin1'
            let description = 'Plugin 1'

            fulfill(name, description)

        })
    }

} // module.exports
