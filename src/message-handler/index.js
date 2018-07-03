const nconf = require('nconf')
const mongoose = require('mongoose')
const mqtt = require('mqtt')
const amqp = require('amqplib')
const Promise = require('bluebird')
const { logger, constants } = require('../lib')
const { Rule, Application, Gateway, Module, Integration } = require('../models')
const Transformer = require('./transformer')

const integrations = {}

class MessageHandler {

    constructor() {
        this.mqttClient = null
        this.amqpChannel = null

        // listen for incoming bridged messages
        process.on(constants.EVENTS.BRIDGE_IN, e => this.bridgeMessage(e))
        process.on(constants.EVENTS.MODULE_ENABLE, e => {
            // TODO
            logger.info(`Should disable module ${e}`)
        })
        process.on(constants.EVENTS.MODULE_ENABLE, e => {
            // TODO
            logger.info(`Should enable module ${e}`)
        })
    }

    async run() {
        this.setupMqtt()
        this.setupAmqp()

        // setup integrations
        if ('integrations' === nconf.get('global.integrationmode')) {
            let modules = await Module.find()
            modules.filter(m => 'enabled' === m.status).forEach(m => {
                logger.info(`Loading module module ${m.name} (${m._id})`)
                integrations[m._id] = require('../modules/' + m.name)
                integrations[m._id].name = m.name
                if (!integrations[m._id].hasOwnProperty('init') || !integrations[m._id].hasOwnProperty('process')) {
                    logger.warn(`Module ${m.name} does not expose required interface.`)
                    delete integrations[m._id]
                }
            })
        }
    }

    setupAmqp() {
        amqp.connect(`amqp://${nconf.get('HANDLER_KEY')}:${nconf.get('HANDLER_SECRET')}@${nconf.get('BROKER_HOST')}:${nconf.get('BROKER_AMQP_PORT')}`)
        .then(conn => {
            logger.info('AMQP message handler connected')
            return conn.createChannel()
        })
        .then(channel => {
            this.amqpChannel = channel
            logger.info('AMQP channel created')
        })
        .catch(err => {
            logger.error('AMQP message handler error:', err.message)
            // try to reconnect
            setTimeout(() => this.setupAmqp(), 1000)
        })
    }

    setupMqtt() {
        this.mqttClient = mqtt.connect({
            host: nconf.get('BROKER_HOST'),
            port: nconf.get('BROKER_MQTT_PORT'),
            username: nconf.get('HANDLER_KEY'),
            password: nconf.get('HANDLER_SECRET'),
        })
        this.mqttClient.on('connect', () => {
            logger.info('MQTT message handler connected')
            this.mqttClient.subscribe('+/+/#')
        })
        this.mqttClient.on('error', err => {
            logger.error('MQTT message handler error:', err.message)
        })
        this.mqttClient.on('close', () => {
            logger.info('MQTT message handler disconnected')
        })
        this.mqttClient.on('message', (topic, message) => this.handleMqttMessage(topic, message))
    }

    handleMqttMessage(topic, message) {

        let [appId, gatewayId, ...topicParts] = topic.split('/')

        // do not process republished messages or messages on the feedback channel (for rules integration mode)
        const lastSegment = topicParts[topicParts.length - 1]
        if ('rules' === nconf.get('global.integrationmode') &&
            (!mongoose.Types.ObjectId.isValid(appId) || !mongoose.Types.ObjectId.isValid(gatewayId) || 'message' === lastSegment)
        ) {
            logger.debug('Republished messages or messages on the feedback channel are not handled (to prevent recursion)')
            return
        }

        // assemble the topic name
        let topicName = topicParts.join('/')

        // notify bridges to forward this raw published message (that is not republished or on the feedback channel)
        if (nconf.get('bridge.aws.aliases')) {

            // replace internal IDs with aliases
            Promise.all([Application.findById(appId), Gateway.findById(gatewayId)])
            .then(results => {
                const [app, gateway] = results
                process.emit(constants.EVENTS.BRIDGE_OUT, {
                    appId,
                    gatewayId,
                    topicName,
                    fullTopic: `${app.alias}/${gateway.alias}/${topicName}`,
                    message,
                })
            })
            .catch(err => logger.error(err.message))

        } else {

            // use internal IDs
            process.emit(constants.EVENTS.BRIDGE_OUT, {
                appId,
                gatewayId,
                topicName,
                fullTopic: topic,
                message,
            })
        }

        if ('rules' === nconf.get('global.integrationmode')) {

            Rule.find()
            .where('application').eq(appId)
            .where('topic').eq(topicName)
            .then(rules => {
                rules.forEach(r => {
                    // perform transformation
                    let t = new Transformer(r.transformation, message)
                    let tm = t.getTransformedMessage()
                    this.performTopicAction(r.action, r.scope, r.output, tm)
                })
            })
            .catch(err => {
                logger.error(err.message)
            })

        } else if ('integrations' === nconf.get('global.integrationmode')) {

            Integration.find({ topic: topicName, status: 'enabled' })
            .then(integrationList => {
                integrationList.forEach(i => {
                    logger.debug('Invoking integration', i._id.toString())
                    i.pipeline.filter(s => 'enabled' === s.status).forEach(s => {
                        logger.debug(`Calling module ${integrations[s.module.toString()].name} with arguments ${JSON.stringify(s.arguments)}`)
                    })
                })
            })
            .catch(err => {
                logger.error(err.message)
            })

        } else {
            logger.warn('Unsupported integration mode:', nconf.get('global.integrationmode'))
        }
    }

    performTopicAction(action, scope, output, payload) {
        switch (action) {
            case 'discard':
                logger.debug('Action -> discard message')
                break

            case 'republish':
                logger.debug(`Action -> republish message on topic: ${scope}/${output}`)
                this.mqttClient.publish(`${scope}/${output}`, payload)
                break

            case 'enqueue':
                logger.debug(`Action -> enqueue message on queue: ${scope}/${output}`)
                this.amqpChannel.assertQueue(`${scope}/${output}`)
                .then(ok => {
                    this.amqpChannel.sendToQueue(`${scope}/${output}`, payload)
                })
                .catch(err => {
                    logger.error('AMQP message handler error:', err.message)
                })
                break
        }
    }

    bridgeMessage(e) {
        const { topic, payload } = e
        if (this.mqttClient) {
            this.mqttClient.publish(topic, payload, { retain: true })
        }

    }
}

module.exports = MessageHandler
