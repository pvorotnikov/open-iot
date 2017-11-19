const express = require('express')
const router = express.Router()
const { logger } = require('./lib')
const { Application, Gateway, Rule, ObjectId } = require('./models')

/* ================================
 * App middleware
 * ================================
 */

// authenticate user
router.post('/user', (req, res, next) => {
    // username - app key
    // password - app secret
    const { username, password } = req.body

    authenticateApp(username, password)
    .then(appName => {
        logger.debug(`Connection allowed for app ${appName} (${username})`)
        res.send('allow')
    })
    .catch((err) => {
        logger.error(err.message)
        res.send('deny')
    })
})

// authenticate vhost
router.post('/vhost', (req, res, next) => {
    // username - the name of the user
    // vhost - the name of the virtual host being accessed
    // ip - the client ip address
    const { username, vhost, ip } = req.body

    res.send('allow')
})

// authorize resource action
router.post('/resource', (req, res, next) => {
    // username - the name of the user
    // vhost - the name of the virtual host containing the resource
    // resource - the type of resource (exchange, queue, topic)
    // name - the name of the resource
    // permission - the access level to the resource (configure, write, read)
    const { username, vhost, resource, name, permission } = req.body

    logger.debug(`Request to ${permission} ${resource}: ${name}`)

    if ('topic' === resource) {

        switch (permission) {

            case 'write':
                authorizeTopicPublish(username, name)
                .then(() => {
                    logger.debug('...allowed')
                    res.send('allow')
                })
                .catch(err => {
                    logger.error('...denied:', err.message)
                    res.send('deny')
                })
                break

            case 'read':
                authorizeTopicSubscribe(username, name)
                .then(reason => {
                    logger.debug('...allowed:', reason)
                    res.send('allow')
                })
                .catch(err => {
                    logger.error('...denied:', err.message)
                    res.send('deny')
                })
                break

            default:
                logger.error('...denied')
                res.send('deny')
                break
        }

    } else {
        logger.debug('...allowed')
        res.send('allow')
    }

})

// authorize topic action
router.post('/topic', (req, res, next) => {
    // username - the name of the user
    // vhost - the name of the virtual host containing the resource
    // resource - the type of resource (topic in this case)
    // name - the name of the exchange
    // permission - the access level to the resource (write  read)
    // routing_key - the routing key of a published message (when the permission is write) or routing key of the queue binding (when the permission is read)
    const { username, vhost, resource, name, permission, routing_key } = req.body

    res.send('allow')
})


/* ================================
 * Authorization and authentication
 * ================================
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

module.exports = router