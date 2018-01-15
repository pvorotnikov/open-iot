const nconf = require('nconf')
const mongoose = require('mongoose')
const awsIot = require('aws-iot-device-sdk')
const hat = require('hat')
const fs = require('fs')
const { logger, constants } = require('../lib')
const { Application, Gateway } = require('../models')

class AwsIotBridge {
    constructor() {

        // holds instance of the device
        this.device = null

        process.on(constants.EVENTS.BRIDGE_AWS_ENABLE, e => this.enableBridge())
        process.on(constants.EVENTS.BRIDGE_AWS_DISABLE, e => this.disableBridge())
        process.on(constants.EVENTS.BRIDGE_OUT, e => this.bridgeMessage(e))

        // evaluate current settings
        if (true === nconf.get('bridge.aws.enabled')) {
            this.enableBridge()
        }
    }

    enableBridge() {
        logger.info('Enabling AWS bridge')

        let deviceSettings = {
            'bridge.aws.endpoint': nconf.get('bridge.aws.endpoint'),
            'bridge.aws.certificate': nconf.get('bridge.aws.certificate'),
            'bridge.aws.publickey': nconf.get('bridge.aws.publickey'),
            'bridge.aws.privatekey': nconf.get('bridge.aws.privatekey'),
            'bridge.aws.ca': nconf.get('bridge.aws.ca'),
        }

        this.createDevice(deviceSettings)
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
        let [appId, gatewayId, messagePart] = topicParts

        // this is application-wide message
        if (2 === topicParts.length) {
            logger.debug(`Bridge from AWS IoT to application: ${topicParts.join('/')}`)
        // this is device-specific message
        } else if (3 === topicParts.length) {
            logger.debug(`Bridge from AWS IoT to device: ${topicParts.join('/')}`)
        } else {
            logger.warn(`Unknown topic format: ${topicParts.join('/')}`)
            return
        }

        let localTopic

        // construct IDs from aliases
        if (nconf.get('bridge.aws.aliases')) {

            let promises = [Application.findOne().where('alias').eq(appId)]
            if (3 === topicParts.length) {
                promises.push(Gateway.findOne().where('alias').eq(gatewayId))
            }

            Promise.all(promises)
            .then(results => {

                const [app, gateway] = results
                if (gateway) {
                    localTopic = `${app._id}/${gateway._id}/${messagePart}`
                } else {
                    localTopic = `${app._id}/${messagePart}`
                }

                process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })
            })
            .catch(err => logger.error(err.message))

        } else {

            if (3 === topicParts.length && (!mongoose.Types.ObjectId.isValid(appId) || !mongoose.Types.ObjectId.isValid(gatewayId))) {
                logger.warn('Unknown application or gateway')
                return
            } else if (2 === topicParts.length && !mongoose.Types.ObjectId.isValid(appId)) {
                logger.warn('Unknown application')
                return
            }

            localTopic = topicParts.join('/')
            process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })
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
