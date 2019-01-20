const nconf = require('nconf')
const express = require('express')
const mqtt = require('mqtt')
const _ = require('lodash')
const Promise = require('bluebird')
const util = require('util')
const { logger, responses, auth, exchange } = require('./lib')
const { Application, Gateway, Rule } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/publish', router)

    router.post('/:appId/*', auth.basic(), async (req, res, next) => {

        try {

            const key = req.user.username
            const secret = req.user.password
            const appId = req.params.appId
            const topic = req.params['0']

            // build message
            let message = JSON.stringify(req.body)

            // build options
            const qosN = parseInt(req.query.qos)
            const qos = qosN <= 2 && qosN >= 0 ? qosN : 0
            const retain = Boolean(req.query.retain)

            await sendMessage(key, secret, `${appId}/${topic}`, message, { qos, retain })
            res.json(new SuccessResponse())

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        }

    })



} // module.exports

/* istanbul ignore next */
function sendMessage(key, secret, topic, message, options={}) {
    return new Promise((fulfill, reject) => {

        const client = mqtt.connect({
            host: nconf.get('BROKER_HOST'),
            port: nconf.get('BROKER_MQTT_PORT'),
            username: key,
            password: secret,
        })

        const integrationMode = nconf.get('global.integrationmode')
        let promise = null

        client.on('connect', () => {

            if ('rules' === integrationMode) {
                promise = exchange.authorizeTopicPublish(key, topic, false) // don't track this authorization
            } else if ('integrations' === integrationMode) {
                promise = exchange.authorizeTopicPublishIntegrations(key, topic, false) // don't track this authorization
            } else {
                return reject(`Unsupported integration mode: ${integrationMode}`)
            }

            promise.then(() => {
                const publish = util.promisify(client.publish).bind(client)
                return publish(topic, message, options)
            })
            .then(() => {
                logger.debug('Message published')
                fulfill()
            })
            .catch(err => {
                logger.warn(`Publish error ${err.message}`)
                reject(err)
            })
            .finally(() => client.end())
        })
        client.on('error', err => {
            reject(err)
            client.end()
        })
    })
}
