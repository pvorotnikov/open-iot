const express = require('express')
const router = express.Router()
const { logger, exchange } = require('./lib')

/* ================================
 * App middleware
 * ================================
 */

// authenticate user
router.post('/user', (req, res, next) => {
    // username - app key
    // password - app secret
    const { username, password } = req.body

    exchange.authenticateApp(username, password)
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
                exchange.authorizeTopicPublish(username, name)
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
                exchange.authorizeTopicSubscribe(username, name)
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

module.exports = router
