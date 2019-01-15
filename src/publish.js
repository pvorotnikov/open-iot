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

    router.post('/:appId/:gatewayId/*', auth.basic(), async (req, res, next) => {

        try {

            const key = req.user.username
            const secret = req.user.password
            const appId = req.params.appId
            const gatewayId = req.params.gatewayId
            const topic = req.params['0']

            // validate topic
            if ('' === topic) {
                throw new HTTPError('You need to specify a topic', 400)
            }

            // build message
            let message = ''
            try {
                message = JSON.stringify(req.body)
            } catch(err) {
                throw new HTTPError('The payload cannot be converted to JSON string', 400)
            }

            // build options
            const qosN = parseInt(req.query.qos)
            const qos = qosN <= 2 && qosN >= 0 ? qosN : 0
            const retain = Boolean(req.query.retain)

            await sendMessage(key, secret, `${appId}/${gatewayId}/${topic}`, message, { qos, retain })
            res.json(new SuccessResponse())

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message))
        }

    })



} // module.exports

function sendMessage(key, secret, topic, message, options={}) {
    return new Promise((fulfill, reject) => {

        const client = mqtt.connect({
            host: nconf.get('BROKER_HOST'),
            port: nconf.get('BROKER_MQTT_PORT'),
            username: key,
            password: secret,
        })
        client.on('connect', () => {
            exchange.authorizeTopicPublish(key, topic, false) // don't track this authorization
            .then(() => {
                const publish = util.promisify(client.publish)
                return publish(topic, message, options)
            })
            .then(() => {
                fulfill()
            })
            .catch(err => {
                reject(err)
            })
            .finally(() => {
                client.end()
            })
        })
        client.on('error', err => {
            reject(err)
            client.end()
        })
    })
}
