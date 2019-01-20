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
const chaiAsPromised = require('chai-as-promised')
chai.use(sinonChai)
chai.use(chaiAsPromised)

// mock mongoose
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongod = new MongoMemoryServer()

const { logger } = require('./_utils')

before(async () => {

    logger.info('Setting up DB')
    const uri = await mongod.getConnectionString()
    const port = await mongod.getPort()
    const dbPath = await mongod.getDbPath()
    const dbName = await mongod.getDbName()
    const mongooseOpts = {
        autoReconnect: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 1000,
        useNewUrlParser: true,
    }

    await mongoose.connect(uri, mongooseOpts)
    logger.info('Mongoose DB setup complete')

    // silent everything
    logger.transports[0].silent = true
})

after(async () => {
    logger.transports[0].silent = false
})

