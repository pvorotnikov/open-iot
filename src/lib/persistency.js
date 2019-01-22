/**
 * Persistency module.
 */
const mongoose = require('mongoose')
const logger = require('./logger')
const { Message, } = require('../models')

async function storeMessage(topic, payload) {
    try {

        // analyze topic
        const [ appId, gwId, ...topicParts ] = topic.split('/')
        let topicName = null
        let gatewayId = null
        if (mongoose.Types.ObjectId.isValid(gwId)) {
            gatewayId = gwId
            topicName = topicParts.join('/')
        } else if (topicParts && topicParts.length) {
            topicName = gwId + '/' + topicParts.join('/')
        } else {
            topicName = gwId
        }

        // store message
        const message = new Message({
            topic: topicName,
            payload,
            application: appId,
            gateway: gatewayId,
        })
        await message.save()

    } catch (err) {
        logger.error(err.message)
    }
}

module.exports = {
    storeMessage
}
