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

function process(arg1, arg2, arg3) {
    console.log(arg1, arg2, arg3)
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
    process,
}
