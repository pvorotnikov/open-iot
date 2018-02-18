// configuration
const nconf = require('nconf')
nconf.env().file({ file: '../src/config.json' })

// prepare testing framework
const chai = require('chai')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

// mock mongoose
const mongoose = require('mongoose')
const Mockgoose = require('mockgoose').Mockgoose
const mockgoose = new Mockgoose(mongoose)

const { logger } = require('./_utils')

before(done => {
    mockgoose.prepareStorage().then(() => {
        logger.info('Mongoose DB setup complete')
        mongoose.connect('mongodb://iot/db', { useMongoClient: true })
        .then(instance => done())
        .catch(err => done(err))
    })
})

after(done => {
    done()
})

