const { Application, Gateway, Rule } = require('../models')

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
 * Authorize publish on a topic
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise}
 */
function authorizeTopicPublish(key, topic) {
    return new Promise((fulfill, reject) => {
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
                // verify that the topic is registered within the application
                Rule.findOne()
                .where('application').eq(app._id)
                .where('topic').eq(topicName)
                .then(rule => {
                    if (rule) {
                        fulfill()
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
 * Authorize subscription to a topic
 * @param  {String} key
 * @param  {String} topic
 * @return {Promise}
 */
function authorizeTopicSubscribe(key, topic) {
    return new Promise((fulfill, reject) => {
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
                fulfill('own topic')
            }
        })
        .catch(err => {
            reject(err)
        })
    })
}

module.exports = {
    authenticateApp,
    authorizeTopicPublish,
    authorizeTopicSubscribe,
}
