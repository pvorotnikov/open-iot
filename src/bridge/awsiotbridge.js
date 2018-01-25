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
            this.device.subscribe('openiot/in/#')
            this.device.publish('openiot/sys/connect', JSON.stringify({ time: Date.now() }))
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

        let [prefix1, prefix2, channelType, ...topicParts] = topic.split('/')

        const hasMessage = 'message' === topicParts[topicParts.length - 1]

        if (!hasMessage) {
            logger.debug('No need to bridge. Only topics ending in /message are bridged')
            return
        }

        if ('app' === channelType) {

            let [appId, ...rest] = topicParts

            if (2 === topicParts.length) {  // :appid/message
                logger.debug(`Bridge from AWS IoT to application feedback channel: ${topicParts.join('/')}`)
            } else if (topicParts.length > 2) { // :appid/topic/parts/message
                logger.debug(`Bridge from AWS IoT to specific application topic: ${topicParts.join('/')}`)
            } else {
                logger.debug(`Unknown topic: ${topicParts.join('/')}`)
                return
            }

            this.publishToApp(appId, rest, payload)

        } else if ('gw' === channelType) {

            let [appId, gatewayId, ...rest] = topicParts

            if (3 === topicParts.length) { // :appid/:gatewayId/message
                logger.debug(`Bridge from AWS IoT to gateway feedback channel: ${topicParts.join('/')}`)
            } else if (topicParts.length > 3) { // :appid/:gatewayId/topic/parts/message
                logger.debug(`Bridge from AWS IoT to specific gateway topic: ${topicParts.join('/')}`)
            } else {
                logger.debug(`Unknown topic: ${topicParts.join('/')}`)
                return
            }

            this.publishToGateway(appId, gatewayId, rest, payload)

        } else {
            logger.warn(`Unknown channel type: ${channelType}`)
            return
        }
    }

    publishToApp(appId, rest, payload) {

        let localTopic

        if (nconf.get('bridge.aws.aliases')) {

            Application.findOne().where('alias').eq(appId)
            .then(app => {
                if (!app) {
                    logger.warn(`Unknown application with alias ${appId}`)
                }

                localTopic = `${app._id}/${rest.join('/')}`
                process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })
            })
            .catch(err => logger.error(err.message))

        } else {

            if (!mongoose.Types.ObjectId.isValid(appId)) {
                logger.warn('Unknown application. Probably bridge.aws.aliases = False?')
                return
            }

            localTopic = `${appId}/${rest.join('/')}`
            process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })

        }

    }

    publishToGateway(appId, gatewayId, rest, payload) {

        let localTopic

        if (nconf.get('bridge.aws.aliases')) {

            let promises = [
                Application.findOne().where('alias').eq(appId),
                Gateway.findOne().where('alias').eq(gatewayId)
            ]

            Promise.all(promises)
            .then(results => {

                const [app, gateway] = results
                if (!app || !gateway) {
                    throw new Error(`Unknown application or gateway with aliases ${appId} ${gatewayId}`)
                }

                localTopic = `${app._id}/${gateway._id}/${rest.join('/')}`
                process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })

            })
            .catch(err => logger.error(err.message))

        } else {

            if (!mongoose.Types.ObjectId.isValid(appId)) {
                logger.warn('Unknown application. Probably bridge.aws.aliases = False?')
                return
            }

            localTopic = `${appId}/${gatewayId}/${rest.join('/')}`
            process.emit(constants.EVENTS.BRIDGE_IN, { topic: localTopic, payload, })

        }

    }

    /**
     * Bridge incoming message from a gateway to AWS IoT.
     * The topic on which the message is bridged is prefix1, prefix2ed
     * by openiot/ segment. The payload is not altered.
     *
     * @param  {Object} e
     */
    bridgeMessage(e) {
        if (this.device) {
            logger.debug(`Bridge to AWS IoT: ${e.fullTopic}`)
            this.device.publish(`openiot/out/${e.fullTopic}`, e.message)
        }
    }
}

module.exports = AwsIotBridge
