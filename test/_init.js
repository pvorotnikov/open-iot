// configuration
const nconf = require('nconf')
nconf.env().file({ file: '../src/config.json' })
nconf.set('ENCRYPTION_SECRET', 'encryption-secret')
nconf.set('HANDLER_KEY', 'handler-key')
nconf.set('HANDLER_SECRET', 'handler-secret')
nconf.set('BROKER_HOST', 'broker-host')

// prepare testing framework
const chai = require('chai')
const sinon = require('sinon')
const sinonMongoose = require('sinon-mongoose')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

// mock mongoose
const mongoose = require('mongoose')
const Mockgoose = require('mockgoose').Mockgoose
const mockgoose = new Mockgoose(mongoose)

const { logger } = require('./_utils')

before(async () => {
    logger.info('Setting up DB')
    await mockgoose.prepareStorage()
    logger.info('Mongoose DB setup complete')
    await mongoose.connect('mongodb://iot/db', { useNewUrlParser: true })

    // silent everything
    logger.transports[0].silent = true
})

after(async () => {
    logger.transports[0].silent = false
})

