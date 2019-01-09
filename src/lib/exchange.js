const nconf = require('nconf')
const Promise = require('bluebird')
const mongoose = require('mongoose')
const { Application, Gateway, Rule, Integration } = require('../models')
const logger = require('./logger')

/* =========================================
 * Exchange authorization and authentication
 * =========================================
 */

/**
 * Authenticate connecting user
 * @param  {String} key
 * @param  {String} secret
 * @return {Promise}
 */
function authenticateApp(key, secret) {
    return new Promise((fulfill, reject) => {

        if (key === nconf.get('HANDLER_KEY') && secret === nconf.get('HANDLER_SECRET')) {
            return fulfill('Message Handler')
        }

        Application.findOne()
        .where('key').eq(key)
        .where('secret').eq(secret)
        .then(app => {
            if (!app) reject(new Error(`Invalid key or secret: ${key}`))
            else fulfill(app.name)
        })
        .catch(err => {
            reject(err)
        })
    })
}

/**
 * Authorize publish on a topic using rules mode
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise}
 */
function authorizeTopicPublish(key, topic, track=true) {
    return new Promise((fulfill, reject) => {

        if (key === nconf.get('HANDLER_KEY')) {

            // check if this is a message on a feedback channel
            if (topic.endsWith('message') && track) {
                const [ appId, gwId, ...topicParts ] = topic.split('/')
                storeStats('out', appId, gwId)
            }

            return fulfill('Message Handler')
        }

        // analyze topic
        const [ appId, gwId, ...topicParts ] = topic.split('/')
        const topicName = topicParts.join('/')

        // allow publishing only on registered topics
        Application.findById(appId)
        .where('key').eq(key)
        .then(app => {
            if (!app) {
                reject(new Error('Application id and key do not match'))
            } else {

                // always allow publishing on the feedback channel
                // note that when the second segment is 'message' this
                // means that we are publishing on the app-wide feedback
                // aka application broadcast
                if ('message' === topicName || 'message' === gwId) {
                    if (track) {
                        storeStats('out', appId, gwId)
                    }
                    return fulfill(app.name)
                }

                // verify that the topic is registered within the application
                Rule.findOne()
                .where('application').eq(app._id)
                .where('topic').eq(topicName)
                .then(rule => {
                    if (rule) {
                        if (track) {
                            storeStats('in', appId, gwId)
                        }
                        fulfill(app.name)
                    } else {
                        reject(new Error(`Topic ${topicName} is not registered within app ${appId}`))
                    }
                })
            }
        })
        .catch(err => {
            reject(err)
        })
    })
}

/**
 * Authorize publish on a topic using itegrations mode
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise}
 */
function authorizeTopicPublishIntegrations(key, topic, track=true) {
    return new Promise((fulfill, reject) => {

        if (key === nconf.get('HANDLER_KEY')) {
            return fulfill('Message Handler')
        }

        // analyze topic
        const [ appId, gwId, ...topicParts ] = topic.split('/')
        const topicName = topicParts.join('/')

        // TODO: prevent publishing on topics that have invalid appId or gwId

        // evaluate it is valid application
        Application.findById(appId)
        .where('key').eq(key)
        .then(app => {
            if (!app) {
                reject(new Error('Application id and key do not match'))
            } else {
                // evaluate it is valid topic
                Integration.findOne({ topic: topicName })
                .then(integration => {
                    if (!integration) {
                        reject(new Error(`Unknown topic: ${topicName} (${app.name})`))
                    } else {
                        fulfill(app.name)
                    }
                })
                .catch(err => {
                    reject(err)
                })
            }
        })
        .catch(err => {
            reject(err)
        })
    })
}

/**
 * Authorize subscription to a topic using rules mode
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise}
 */
function authorizeTopicSubscribe(key, topic) {
    return new Promise((fulfill, reject) => {

        if (key === nconf.get('HANDLER_KEY')) {
            return fulfill('Message Handler')
        }

        // analyze topic
        const [ appId, gwId, ...topicParts ] = topic.split('/')
        const topicName = topicParts.join('/')

        // allow subscription to own topics
        Application.findById(appId)
        .where('key').eq(key)
        .then(app => {
            if (!app) {
                // TODO: in sharing scenario this should branch in permissions evaluation
                reject(new Error('Application id and key do not match'))
            } else {
                fulfill(app.name)
            }
        })
        .catch(err => {
            reject(err)
        })
    })
}

/**
 * Authorize subscription to a topic using integrations mode
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise}
 */
function authorizeTopicSubscribeIntegrations(key, topic) {
    return new Promise((fulfill, reject) => {

        if (key === nconf.get('HANDLER_KEY')) {
            return fulfill('Message Handler')
        }

        // analyze topic
        const [ appId, gwId, ...topicParts ] = topic.split('/')
        let topicName
        if (mongoose.Types.ObjectId.isValid(gwId)) {
            topicName = topicParts.join('/')
        } else if (topicParts && topicParts.length) {
            topicName = gwId + '/' + topicParts.join('/')
        } else {
            topicName = gwId
        }

        // TODO: perform deeper analysis of the appId and gwId parts to evaluate subscription

        // evaluate it is valid application
        Application.findById(appId)
        .where('key').eq(key)
        .then(app => {
            if (!app) {
                reject(new Error('Application id and key do not match'))
            } else {
                // evaluate it is valid topic
                Integration.findOne({ topic: topicName })
                .then(integration => {
                    if (!integration) {
                        reject(new Error(`Unknown topic: ${topicName} (${app.name})`))
                    } else {
                        fulfill(app.name)
                    }
                })
                .catch(err => {
                    reject(err)
                })
            }
        })
        .catch(err => {
            reject(err)
        })
    })
}

function storeStats(traffic, appId, gwId) {
    if ('in' === traffic) {

        Application.findByIdAndUpdate(appId, { $inc: { statsIn: 1 } })
        .catch(err => logger.error(err.message))

        Gateway.findByIdAndUpdate(gwId, { $inc: { statsIn: 1 } })
        .catch(err => logger.error(err.message))

    } else if ('out' === traffic) {

        Application.findByIdAndUpdate(appId, { $inc: { statsOut: 1 } })
        .catch(err => logger.error(err.message))

        if ('message' !== gwId && mongoose.Types.ObjectId.isValid(gwId)) {
            Gateway.findByIdAndUpdate(gwId, { $inc: { statsOut: 1 } })
            .catch(err => logger.error(err.message))
        }

    }
}

module.exports = {
    authenticateApp,
    authorizeTopicPublish,
    authorizeTopicPublishIntegrations,
    authorizeTopicSubscribe,
    authorizeTopicSubscribeIntegrations,
}
