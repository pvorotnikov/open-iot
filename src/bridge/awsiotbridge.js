const awsIot = require('aws-iot-device-sdk')
const hat = require('hat')
const fs = require('fs')
const { logger, constants } = require('../lib')
const { Setting } = require('../models')

class AwsIotBridge {
    constructor() {

        // holds instance of the device
        this.device = null

        process.on(constants.EVENTS.BRIDGE_AWS_ENABLE, e => this.enableBridge())
        process.on(constants.EVENTS.BRIDGE_AWS_DISABLE, e => this.disableBridge())

        // evaluate current settings
        Setting.findOne({ key: 'bridge.aws.enabled', value: true })
        .then(setting => {
            if (setting) {
                this.enableBridge()
            }
        })
        .catch(err => {
            logger.error(err.message)
        })

    }

    enableBridge() {
        logger.info('Enabling AWS bridge')

        Setting.find({
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
        .then(settings => {
            let deviceSettings = {}
            settings.forEach(s => deviceSettings[s.key] = s.value)
            this.createDevice(deviceSettings)
        })
        .catch(err => {
            logger.error(err.message)
        })
    }

    disableBridge() {
        logger.info('Disabling AWS bridge')
        this.endDevice()
    }

    createDevice(deviceSettings) {
        this.device = awsIot.device({
            privateKey: new Buffer(deviceSettings['bridge.aws.privatekey']),
            clientCert: new Buffer(deviceSettings['bridge.aws.certificate']),
            caCert: new Buffer(deviceSettings['bridge.aws.ca']),
            client: `open-iot-${hat(32, 16)}`,
            host: deviceSettings['bridge.aws.endpoint'],
        })

        this.device.on('close', () => {
            logger.warn('Device connection to AWS IoT Closed');
        })
        this.device.on('reconnect', () => {
            logger.info('Device reconnected to AWS IoT')
        })
        this.device.on('offline', () => {
            logger.warn('Device offline')
        })
        this.device.on('error', (err) => {
            logger.error(err)
        })
        this.device.on('connect', () => {
            logger.info('Device connected to AWS IoT')
            this.device.subscribe('#')
            this.device.publish('openiot/connect', JSON.stringify({ time: Date.now() }))
        })
        this.device.on('message', (topic, payload) => {
            logger.info('AWS IoT Message', topic, payload.toString())
        })
    }

    endDevice() {
        if (this.device) {
            this.device.end(() => {
                this.device = null
            })
        }
    }
}

module.exports = AwsIotBridge
