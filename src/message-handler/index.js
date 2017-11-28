const nconf = require('nconf')
const mqtt = require('mqtt')
const amqp = require('amqplib')
const Promise = require('bluebird')
const { logger } = require('../lib')
const { Rule } = require('../models')
const Transformer = require('./transformer')

class MessageHandler {

    constructor() {
        this.mqttClient = null
        this.amqpChannel = null
    }

    run() {
        this.setupMqtt()
        this.setupAmqp()
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
        let topicName = topicParts.join('/')

        Rule.find()
        .where('application').eq(appId)
        .where('topic').eq(topicName)
        .then(rules => {
            rules.forEach(r => {
                this.performTopicAction(r.action, r.scope, r.output, message)
            })
        })
        .catch(err => {
            logger.error(err.message)
        })
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
}

module.exports = MessageHandler
