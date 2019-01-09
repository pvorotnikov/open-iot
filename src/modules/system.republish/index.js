const _ = require('lodash')

function prepare() {
    console.log('system.republish.prepare() called')
}

function load() {
    console.log('system.republish.load() called')
}

function getCapabilities() {
    console.log('system.republish.getCapabilities() called')
}

function start() {
    console.log('system.republish.start() called')
}

function suspend() {
    console.log('system.republish.suspend() called')
}

function resume() {
    console.log('system.republish.resume() called')
}

function stop() {
    console.log('system.republish.stop() called')
}

function unload() {
    console.log('system.republish.unload() called')
}

function cleanup() {
    console.log('system.republish.cleanup() called')
}

function _process(destinationTopicTemplate, context) {
    const { topic, message, appId, gatewayId } = context
    const destinationTopic = processTemplateString(destinationTopicTemplate, { ':appId': appId, ':gatewayId': gatewayId })
    console.log(`Republishing message from ${appId}/${gatewayId}/${topic} to ${destinationTopic}`)
    process.emit('mqtt.publish.message', {
        topic: destinationTopic,
        payload: message,
    })
    return message
}

function processTemplateString(template, replacements) {
    if (!_.isString(template)) return template
    let result = template
    for (let i in replacements) {
        result = result.replace(i, replacements[i])
    }
    return result
}

module.exports = {
    prepare,
    load,
    getCapabilities,
    start,
    suspend,
    resume,
    stop,
    unload,
    cleanup,
    process: _process,
}
