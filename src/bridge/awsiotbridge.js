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
        process.on(constants.EVENTS.BRIDGE_OUT, e => this.bridgeMessage(e))

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
            logger.warn('Bridge connection to AWS IoT Closed');
        })
        this.device.on('reconnect', () => {
            logger.info('Bridge reconnected to AWS IoT')
        })
        this.device.on('offline', () => {
            logger.warn('Bridge offline')
        })
        this.device.on('error', (err) => {
            logger.error(err)
        })
        this.device.on('connect', () => {
            logger.info('Bridge connected to AWS IoT')
            this.device.subscribe('openiot/+/message')
            this.device.subscribe('openiot/+/+/message')
            this.device.publish('openiot/connect', JSON.stringify({ time: Date.now() }))
        })
        this.device.on('message', this.receiveMessage.bind(this))
    }

    endDevice() {
        if (this.device) {
            this.device.end(() => {
                this.device = null
            })
        }
    }

    /**
     * Receive a message from AWS IoT. Only messages
     * on topics conforming the following schema will be processed:
     * openiot/#/message
     *
     * @param  {[type]} topic   [description]
     * @param  {[type]} payload [description]
     * @return {[type]}         [description]
     */
    receiveMessage(topic, payload) {

        let [prefix, ...topicParts] = topic.split('/')
        let localTopic = topicParts.join('/')

        // this is application-wide message
        if (2 === topicParts.length) {
            logger.debug(`Bridge from AWS IoT to application: ${localTopic}`)
            process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })

        // this is device-specific message
        } else if (3 === topicParts.length) {
            logger.debug(`Bridge from AWS IoT to device: ${localTopic}`)
            process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })

        } else {
            logger.warn(`Unknown topic format: ${localTopic}`)
        }

    }

    /**
     * Bridge incoming message from a gateway to AWS IoT.
     * The topic on which the message is bridged is prefixed
     * by openiot/ segment. The payload is not altered.
     *
     * @param  {Object} e
     */
    bridgeMessage(e) {
        if (this.device) {
            logger.debug(`Bridge to AWS IoT: ${e.fullTopic}`)
            this.device.publish(`openiot/${e.fullTopic}`, e.message)
        }
    }
}

module.exports = AwsIotBridge
