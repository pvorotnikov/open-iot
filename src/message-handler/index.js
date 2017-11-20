const nconf = require('nconf')
const mqtt = require('mqtt')
const Promise = require('bluebird')
const { logger } = require('../lib')
const { Rule } = require('../models')

class MessageHandler {

    constructor() {
        this.client = null
    }

    run() {
        this.client = mqtt.connect({
            host: nconf.get('BROKER_HOST'),
            port: nconf.get('BROKER_PORT'),
            username: nconf.get('HANDLER_KEY'),
            password: nconf.get('HANDLER_SECRET'),
        })
        this.client.on('connect', () => {
            logger.info('Message handler connected')
            this.client.subscribe('+/+/#')
        })
        this.client.on('error', err => {
            logger.error('Message handler error:', err.message)
        })
        this.client.on('close', () => {
            logger.info('Message handler disconnected')
        })
        this.client.on('message', (topic, message) => this.handleMqttMessage(topic, message))
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
                logger.debug('Discard message')
                break

            case 'republish':
                logger.debug('Republish message on topic', `${scope}/${output}`)
                this.client.publish(`${scope}/${output}`, payload)
                break

            case 'enqueue':
                logger.warn(`Enqueue message on queue: ${scope}/${output}. Not supported yet!`)
                break
        }
    }
}

module.exports = MessageHandler
