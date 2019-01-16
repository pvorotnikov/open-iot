const nconf = require('nconf')
const mongoose = require('mongoose')
const { Application, Gateway, Rule, Integration } = require('../models')
const logger = require('./logger')

/* =========================================
 * Exchange authorization and authentication
 * =========================================
 */

/**
 * Authenticate connecting user
 * @async
 * @param  {String} key
 * @param  {String} secret
 * @return {Promise<String>}
 */
async function authenticateApp(key, secret) {

    if (key === nconf.get('HANDLER_KEY') && secret === nconf.get('HANDLER_SECRET')) {
        return 'Message Handler'
    }

    const app = await Application.findOne()
    .where('key').eq(key)
    .where('secret').eq(secret)
    if (!app) {
        throw new Error(`Invalid key or secret: ${key}`)
    }

    return app.name
}

/**
 * Authorize publish on a topic using rules mode
 * @async
 * @param  {String} key
 * @param  {String} topic
 * @param  {Boolean} track - whether to track the request
 * @return {Promise<String>}
 */
async function authorizeTopicPublish(key, topic, track=true) {

    if (key === nconf.get('HANDLER_KEY')) {

        // check if this is a message on a feedback channel
        if (topic.endsWith('message') && track) {
            const [ appId, gwId, ...topicParts ] = topic.split('/')
            storeStats('out', appId, gwId)
        }

        return 'Message Handler'
    }

    // analyze topic
    const [ appId, gwId, ...topicParts ] = topic.split('/')
    const topicName = topicParts.join('/')

    // allow publishing only on registered topics
    const app = await Application.findById(appId).where('key').eq(key)
    if (!app) {
        throw new Error('Application id and key do not match')
    }

    // always allow publishing on the feedback channel
    // note that when the second segment is 'message' this
    // means that we are publishing on the app-wide feedback
    // aka application broadcast
    if ('message' === topicName || 'message' === gwId) {
        if (track) {
            storeStats('out', appId, gwId)
        }
        return app.name
    }

    // verify that the topic is registered within the application
    const rule = await Rule.findOne()
    .where('application').eq(app._id)
    .where('topic').eq(topicName)
    if (!rule) {
        throw new Error(`Topic ${topicName} is not registered within app ${appId}`)
    }

    if (track) {
        storeStats('in', appId, gwId)
    }

    return app.name
}

/**
 * Authorize publish on a topic using itegrations mode
 * @async
 * @param  {String} key
 * @param  {String} topic
 * @param  {Boolean} track - whether to track the request
 * @return {Promise<String>}
 */
async function authorizeTopicPublishIntegrations(key, topic, track=true) {

    if (key === nconf.get('HANDLER_KEY')) {
        return 'Message Handler'
    }

    // analyze topic
    const [ appId, gwId, ...topicParts ] = topic.split('/')
    const topicName = topicParts.join('/')

    // TODO: prevent publishing on topics that have invalid appId or gwId

    // evaluate it is valid application
    const app = await Application.findById(appId).where('key').eq(key)
    if (!app) {
        throw new Error('Application id and key do not match')
    }

    // evaluate it is valid topic
    const integration = await Integration.findOne({ topic: topicName })
    if (!integration) {
        throw new Error(`Unknown topic: ${topicName} (${app.name})`)
    }

    return app.name
}

/**
 * Authorize subscription to a topic using rules mode
 * @async
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise<String>}
 */
async function authorizeTopicSubscribe(key, topic) {

    if (key === nconf.get('HANDLER_KEY')) {
        return 'Message Handler'
    }

    // analyze topic
    const [ appId, gwId, ...topicParts ] = topic.split('/')
    const topicName = topicParts.join('/')

    // allow subscription to own topics
    const app = await Application.findById(appId).where('key').eq(key)
    if (!app) {
        // TODO: in sharing scenario this should branch in permissions evaluation
        throw new Error('Application id and key do not match')
    }

    return app.name
}

/**
 * Authorize subscription to a topic using integrations mode
 * @async
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise<String>}
 */
async function authorizeTopicSubscribeIntegrations(key, topic) {

    if (key === nconf.get('HANDLER_KEY')) {
        return 'Message Handler'
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
    const app = await Application.findById(appId).where('key').eq(key)
    if (!app) {
        throw new Error('Application id and key do not match')
    }

    // evaluate it is valid topic
    const integration = await Integration.findOne({ topic: topicName })
    if (!integration) {
        throw new Error(`Unknown topic: ${topicName} (${app.name})`)
    }

    return app.name
}

async function storeStats(traffic, appId, gwId) {
    try {
        if ('in' === traffic) {

            await Application.findOneAndUpdate(appId, { $inc: { statsIn: 1 } })
            await Gateway.findOneAndUpdate(gwId, { $inc: { statsIn: 1 } })

        } else if ('out' === traffic) {

            await Application.findOneAndUpdate(appId, { $inc: { statsOut: 1 } })
            if ('message' !== gwId && mongoose.Types.ObjectId.isValid(gwId)) {
                await Gateway.findOneAndUpdate(gwId, { $inc: { statsOut: 1 } })
            }

        }
    } catch (err) {
        logger.error(err.message)
    }
}

module.exports = {
    authenticateApp,
    authorizeTopicPublish,
    authorizeTopicPublishIntegrations,
    authorizeTopicSubscribe,
    authorizeTopicSubscribeIntegrations,
}
