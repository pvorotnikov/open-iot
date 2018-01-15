const Promise = require('bluebird')
const express = require('express')
const router = express.Router()
const validator = require('validator')
const { logger, responses, auth, utils, constants } = require('./lib')
const { ACCESS_LEVEL, Setting } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch all settings
router.get('/', auth.protect(ACCESS_LEVEL.ADMIN), (req, res, next) => {

    Setting.find()
    .sort('key')
    .then(settings => {
        let data = settings.map(s => ({
            key: s.key,
            value: s.value,
            description: s.description,
            updated: s.updated,
            readOnly: s.readOnly,
        }))
        res.json({ status: 'ok', data })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// fetch all settings
router.put('/:key', auth.protect(ACCESS_LEVEL.ADMIN), (req, res, next) => {

    const { value } = req.body

    Setting.findOne({ key: req.params.key })
    .then(setting => {
        if ('bridge.aws.enabled' === req.params.key) {
            return enableAWSBridge(setting, value)
        } else {
            setting.value = value
            setting.updated = Date.now()
            return setting.save()
        }
    })
    .then(setting => {
        let data = {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updated: setting.updated,
            readOnly: setting.readOnly,
        }
        res.json(new SuccessResponse(data))
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

function enableAWSBridge(setting, state) {
    return new Promise((fulfill, reject) => {

        logger.debug(`Setting AWS Enabled to ${state}`)

        if (!state) {   // disable bridge

            setting.value = state
            setting.updated = Date.now()
            setting.save()
            .then(result => {
                // emit event to disconnect the bridge
                process.emit(constants.EVENTS.BRIDGE_AWS_DISABLE)
                fulfill(result)
            })
            .catch(err => reject(err))

        } else {        // enable bridge

            Setting.count({
                $and: [
                    // include all aws bridge settings...
                    { key: { $in: [
                        'bridge.aws.endpoint',
                        'bridge.aws.certificate',
                        'bridge.aws.publickey',
                        'bridge.aws.privatekey',
                        'bridge.aws.ca'
                    ] } },
                    // ...that are not empty
                    { value: { $ne: '' } }
                ]
            })
            .then(count => {
                if (count < 5) {
                    throw new Error('You must first configure all AWS bridge settings')
                }

                setting.value = state
                setting.updated = Date.now()
                return setting.save()
            })
            .then(result => {
                // emit event to connect the bridge
                process.emit(constants.EVENTS.BRIDGE_AWS_ENABLE)
                fulfill(result)
            })
            .catch(err => reject(err))

        }

    })
}

module.exports = router
