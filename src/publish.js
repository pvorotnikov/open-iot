const mqtt = require('mqtt')
const _ = require('lodash')
const nconf = require('nconf')
const express = require('express')
const Promise = require('bluebird')
const router = express.Router()
const { logger, responses, auth, exchange } = require('./lib')
const { Application, Gateway, Rule } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

/* ================================
 * App middleware
 * ================================
 */

router.post('/:appId/:gatewayId/*', auth.basic(), (req, res, next) => {
    const key = req.user.username
    const secret = req.user.password
    const appId = req.params.appId
    const gatewayId = req.params.gatewayId
    const topic = req.params['0']
    if ('' === topic) {
        return res.status(400).json(new ErrorResponse('You need to specify a topic'))
    }

    let message = ''
    try {
        message = JSON.stringify(req.body)
    } catch(err) {
        return res.status(400).json(new ErrorResponse('The payload cannot be converted to JSON string'))
    }

    const qos = _(req.query.qos).isNumber() && req.query.qos <= 2 && req.query.qos >= 0 ? req.query.qos : 0
    const retain = Boolean(req.query.retain)

    sendMessage(key, secret, `${appId}/${gatewayId}/${topic}`, message, { qos, retain })
    .then(() => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(400).json(new ErrorResponse(err.message))
    })
})

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
                client.publish(topic, message, options, err => {
                    if (err) reject(err)
                    else fulfill()
                })
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

module.exports = router
