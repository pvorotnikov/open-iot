/* This route is responsible for accepting a zipped module
 * called a plugin and unzipping it in a temporary directory.
 * Once the plugin is unzipped, it is verified for consistency,
 * i.e. various checks are performed whether all the necessary
 * files are present - package.json, index.js.
 * If the plugin is deemed fit and healthy it is moved to the
 * modules directory and then it can be ivoked by the pipeline
 * integration system.
 */

const express = require('express')
const validator = require('validator')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const hat = require('hat')
const AdmZip = require('adm-zip')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Plugin } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError, } = responses


// paths
const MODULES_DIR = path.join(__dirname, 'modules')
const TEMP_DIR = path.join(__dirname, 'temp')
// create temp dir if needed
if (!fs.existsSync(TEMP_DIR)){
    fs.mkdirSync(TEMP_DIR);
}


module.exports = function(app) {

    const router = express.Router()
    app.use('/api/plugins', router)

    // fetch all available plugins and their statuses
    router.get('/', auth.protect(ACCESS_LEVEL.ADMIN), async (req, res, next) => {
        try {
            const plugins = await Plugin.find()
            const data = plugins.map(p => ({
                id: p._id,
                name: p.name,
                description: p.description,
            }))
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        }
    })

    /**
     * Upload a new plugin. This handler accept multipart
     */
    router.post('/', auth.protect(ACCESS_LEVEL.ADMIN), async (req, res, next) => {

        try {
            const pluginTempName = await unzipPlugin(req.body, TEMP_DIR)
            logger.info(`Unzipped plugin as ${pluginTempName}`)

            // clean up ziped file
            await utils.unlinkFile(path.join(TEMP_DIR, pluginTempName + '.zip'))

            const { name, description } = await validatePlugin(path.join(TEMP_DIR, pluginTempName))
            logger.info(`Plugin ${name} is valid.`)

            // install plugin
            await utils.renameFile(path.join(TEMP_DIR, pluginTempName), path.join(MODULES_DIR, name))

            const plugin = await new Plugin({
                name: name,
                description: description,
            }).save()

            const data = {
                id: plugin._id,
                name: plugin.name,
                description: plugin.description,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        }

    })


    /**
     * Perform plugin unzipping in a directory
     * that is named after the plugin name.
     * @param {Buffer} buf buffer with the file contents
     * @param {String} destination where to put the unzipped content
     * @return {Promise<String>}
     */
    async function unzipPlugin(buf, destination) {
        let uniqueId = hat(32)
        let zipFile = `${destination}/${uniqueId}.zip`

        // write the zip file in destination directory
        await utils.writeFile(zipFile, buf)

        // unzip the file
        const zip = new AdmZip(zipFile)
        zip.extractAllTo(path.join(destination, uniqueId), true) // overwrite=True

        return uniqueId
    }

    /**
     * Perform plugin validation.
     * @param {String} plugin source
     * @return {Promise<Object>}
     */
    async function validatePlugin(pluginSource) {
        const hasManifest = await utils.fileExists(path.join(pluginSource, 'package.json'))
        if (!hasManifest) {
            throw new HTTPError('Plugin does not have package.json', 400)
        }

        const hasIndex = await utils.fileExists(path.join(pluginSource, 'index.js'))
        if (!hasIndex) {
            throw new HTTPError('Plugin does not have index.js', 400)
        }

        const manifest = require(path.join(pluginSource, 'package.json'))
        const name = manifest.name
        const description = manifest.description || null

        if (_(name).isEmpty()) {
            throw new HTTPError('Plugin name is required')
        }

        return { name, description }
    }

} // module.exports
