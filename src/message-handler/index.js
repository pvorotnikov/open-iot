const nconf = require('nconf')
const _ = require('lodash')
const mongoose = require('mongoose')
const mqtt = require('mqtt')
const amqp = require('amqplib')
const Promise = require('bluebird')
const { logger, constants, persistency, } = require('../lib')
const { Rule, Application, Gateway, Module, Integration } = require('../models')
const Transformer = require('./transformer')

const integrations = {}

class MessageHandler {

    constructor() {
        this.mqttClient = null
        this.amqpChannel = null

        // listen for incoming bridged messages
        process.on(constants.EVENTS.BRIDGE_IN, e => this.bridgeMessage(e))
        process.on(constants.EVENTS.MQTT_PUBLISH_MESSAGE, e => this.publishMessage(e))

        /**
         * Manage module disable. This result in calling
         * its lifecycle hooks: stop, unload and cleanup,
         * in that order.
         */
        process.on(constants.EVENTS.MODULE_DISABLE, e => {
            logger.info(`Disabling module ${e}`)

            // call plugin hook - stop
            if (integrations[e].hasOwnProperty('stop')) {
                integrations[e].stop()
            }

            // call plugin hook - unload
            if (integrations[e].hasOwnProperty('unload')) {
                integrations[e].unload()
            }

            // call plugin hook - cleanup
            if (integrations[e].hasOwnProperty('cleanup')) {
                integrations[e].cleanup()
            }

            delete integrations[e]
        })

        /**
         * Manage module enable. This result in loadding
         * the module (via require) and calling its
         * lifecycle hooks: prepare, load, getCapabilities
         * and start, in that order.
         */
        process.on(constants.EVENTS.MODULE_ENABLE, async e => {
            logger.info(`Enabling module ${e}`)

            let m = await Module.findById(e)
            try {
                if (m) {

                    integrations[m._id] = require('../modules/' + m.name)
                    integrations[m._id]._name = m.name
                    if (!integrations[m._id].hasOwnProperty('process')) {
                        logger.warn(`Module ${m.name} does not expose required interface.`)
                        delete integrations[m._id]
                    }

                    // call plugin hook - prepare
                    if (integrations[m._id].hasOwnProperty('prepare')) {
                        integrations[m._id].prepare()
                    }

                    // call plugin hook - load
                    if (integrations[m._id].hasOwnProperty('load')) {
                        integrations[m._id].load()
                    }

                    // call plugin hook - getCapabilities
                    if (integrations[m._id].hasOwnProperty('getCapabilities')) {
                        let cap = integrations[m._id].getCapabilities()
                        integrations[m._id]._capabilities = cap
                    }

                    // call plugin hook - start
                    if (integrations[m._id].hasOwnProperty('start')) {
                        integrations[m._id].start()
                    }

                } else {
                    logger.error(`Module not found: ${e}`)
                }

            } catch (err) {
                logger.error(err.message)
            }

        })
    }

    /**
     * Run the message handler. This will setup
     * all the clients listening for messages and
     * interracting with the broker over MQTT and
     * AMQP.
     * @async
     */
    async run() {
        this.setupMqtt()
        this.setupAmqp()

        // setup integrations
        if ('integrations' === nconf.get('global.integrationmode')) {
            let modules = await Module.find()
            modules.filter(m => 'enabled' === m.status).forEach(m => {
                try {
                    logger.info(`Loading module module ${m.name} (${m._id})`)
                    integrations[m._id] = require('../modules/' + m.name)
                    integrations[m._id]._name = m.name
                    if (!integrations[m._id].hasOwnProperty('process')) {
                        logger.warn(`Module ${m.name} does not expose required interface.`)
                        delete integrations[m._id]
                    }

                    // call plugin hook - prepare
                    if (integrations[m._id].hasOwnProperty('prepare')) {
                        integrations[m._id].prepare()
                    }

                    // call plugin hook - load
                    if (integrations[m._id].hasOwnProperty('load')) {
                        integrations[m._id].load()
                    }

                    // call plugin hook - getCapabilities
                    if (integrations[m._id].hasOwnProperty('getCapabilities')) {
                        let cap = integrations[m._id].getCapabilities()
                        integrations[m._id]._capabilities = cap
                    }

                    // call plugin hook - start
                    if (integrations[m._id].hasOwnProperty('start')) {
                        integrations[m._id].start()
                    }
                } catch (err) {
                    logger.error(err.message)
                }
            })
        }
    }

    /**
     * Setup the AMQP client connection.
     */
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

    /**
     * Setup the MQTT client connection.
     * The client uses HANDLER_KEY and HANDLER_SECRET
     * (defined as env variables) to allow subscription
     * to wildcard topic (+/+/#)
     */
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

    /**
     * Main handler for MQTT messages coming to the broker.
     * This is the entry point for all broker communication
     * including:
     * - messages published from gateways
     * - messages published from backend (usually on /message topic)
     * - bridged in messages (incoming messages on the broker bridge)
     * - messages published from this client (as a result of republish action)
     * - messages published via the 'publish' event on the event bus
     * @param {String} topic
     * @param {Buffer} message
     */
    handleMqttMessage(topic, message) {

        // persist the message using default persistency policy
        persistency.storeMessage(topic, message)

        let [appId, gatewayId, ...topicParts] = topic.split('/')

        // do not process republished messages,
        // messages on application level or
        // messages on the feedback channel,
        // i.e. from backend
        // (for 'rules' integration mode)
        const lastSegment = topicParts[topicParts.length - 1]
        if ('rules' === nconf.get('global.integrationmode') &&
            (!mongoose.Types.ObjectId.isValid(appId) ||
             !mongoose.Types.ObjectId.isValid(gatewayId) ||
             'message' === lastSegment)
        ) {
            logger.debug('Republished messages or messages on the feedback channel are not handled (to prevent recursion)')
            return
        }

        // assemble the topic name
        let topicName = topicParts.join('/')

        // notify bridges to forward this raw published message
        // (that is not republished, not in application scope
        // or on the feedback channel)
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

            // create context that is passed to the invoked integration step
            const context = {
                appId,
                gatewayId,
                topic: topicName,
                message,
            }

            Integration.find({ topic: topicName, status: 'enabled' })
            .then(integrationList => {
                integrationList.forEach(i => {
                    logger.debug('Invoking integration', i._id.toString())
                    i.pipeline.filter(s => 'enabled' === s.status).reduce((accumulator, s) => {
                        // call plugin hook - process
                        logger.debug(`Calling module ${integrations[s.module.toString()]._name} with arguments ${JSON.stringify(s.arguments)}`)
                        context.message = accumulator
                        let newMessage = integrations[s.module.toString()].process.apply(null, s.arguments.concat([context]))
                        return _.isUndefined(newMessage) ? accumulator : newMessage
                    }, message)
                })
            })
            .catch(err => {
                logger.error(err.message)
            })

        } else {
            logger.warn('Unsupported integration mode:', nconf.get('global.integrationmode'))
        }
    }

    /**
     * Perform a specific action on a message coming on a topic.
     * This is invokend only when the integration mode is configured
     * as 'rules'. The action is one of:
     * - discard - perform no action
     * - republish - republish the message on {scope}/{output} topic
     * - enqueue - put the message in {scope}/{output} queue
     * @param {String} action
     * @param {String} scope
     * @param {String} output
     * @param {Buffer} payload
     */
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

    /**
     * Publish messages coming from the broker bridge
     * to the main broker.
     * @param {Event} e
     */
    bridgeMessage(e) {
        const { topic, payload } = e
        if (this.mqttClient) {
            this.mqttClient.publish(topic, payload, { retain: true })
        }

    }

    /**
     * Publish messages coming from the 'publish' event on
     * the event bus to the main broker.
     * @param {Event} e
     */
    publishMessage(e) {
        const { topic, payload } = e
        if (this.mqttClient) {
            this.mqttClient.publish(topic, payload)
        }
    }
}

module.exports = MessageHandler
