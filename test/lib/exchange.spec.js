const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { cleanDb, logger, objectId } = require('../_utils')

const { utils } = require('../../src/lib')
const { Application, Gateway, Rule, User } = require('../../src/models')
const exchange = rewire('../../src/lib/exchange')

describe('Exchange', function() {

    const USER_ID = objectId()
    const APP_ID = objectId()
    const GATEWAY_ID = objectId()
    const RULE_ID = objectId()
    const APP_KEY = utils.generateAccessKey(32)
    const APP_SECRET = utils.generateSecretKey(64)

    before(done => {
        cleanDb()
        .then(() => {

            return Promise.all([
                // create user
                new User({
                    _id: USER_ID,
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@test.com',
                    password: utils.generatePassword('test'),
                }).save(),

                // create application
                new Application({
                    _id: APP_ID,
                    user: USER_ID,
                    name: 'Test',
                    alias: 'test',
                    description: 'Test app',
                    key: APP_KEY,
                    secret: APP_SECRET,
                }).save()

            ])
        })
        .then(res => {
            done()
        })
    })

    after(done => {
        cleanDb()
        .then(res => done())
    })

    /* ============================
     * NEW CONNECTION SUITE
     * ============================
     */

    describe('New connection', function() {

        it('should not authenticate app - does not exist', done => {
            exchange.authenticateApp(null, null)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.have.string('Invalid key or secret')
            })
            .finally(() => {
                done()
            })
        })

        it('should not authenticate app - wrong key', done => {
            exchange.authenticateApp('wrong', APP_SECRET)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.have.string('Invalid key or secret')
            })
            .finally(() => done())
        })

        it('should not authenticate app - wrong secret', done => {
            exchange.authenticateApp(APP_KEY, 'wrong')
            .catch(err => {
                err.should.be.an('error')
                err.message.should.have.string('Invalid key or secret')
            })
            .finally(() => done())
        })

        it('should authenticate app', done => {
            exchange.authenticateApp(APP_KEY, APP_SECRET)
            .then(res => {
                res.should.be.a('string')
                res.should.equal('Test')
            })
            .finally(() => done())
        })

        it('should authenticate app - message handler', done => {
            exchange.authenticateApp(nconf.get('HANDLER_KEY'), nconf.get('HANDLER_SECRET'))
            .then(res => {
                res.should.be.a('string')
                res.should.equal('Message Handler')
            })
            .finally(() => done())
        })

    })

    /* ============================
     * NEW CONNECTION SUITE
     * ============================
     */

    describe('Publish', function() {

        let storeStats = exchange.__get__('storeStats')

        it('should publish - message handler, regular topic', done => {
            exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), 'test', true)
            .then(res => {
                expect(res).to.be.undefined
            })
            .finally(() => done())
        })

        it('should publish - message handler, feedback topic', done => {

            let spy = sinon.spy()
            exchange.__set__('storeStats', spy)

            exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), `${APP_ID}/${GATEWAY_ID}/message`, true)
            .then(res => {
                expect(res).to.be.undefined
                spy.should.have.been.called
            })
            .finally(() => done())
        })

    })

})
