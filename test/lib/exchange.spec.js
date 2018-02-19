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
                }).save(),

                // create gateway
                new Gateway({
                    _id: GATEWAY_ID,
                    user: USER_ID,
                    application: APP_ID,
                    name: 'Test',
                    alias: 'test',
                    description: 'Test gateway',
                }).save(),

                // create rule
                new Rule({
                    _id: RULE_ID,
                    user: USER_ID,
                    application: APP_ID,
                    topic: 'test',
                    transformation: null,
                    action: 'discard',
                    output: null,
                    scope: null,
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
     * PUBLISH SUITE
     * ============================
     */

    describe('Publish', function() {

        const storeStats = exchange.__get__('storeStats')

        afterEach(() => {
            exchange.__set__('storeStats', storeStats)
        })

        it('should publish - message handler, regular topic', done => {
            exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), 'test', true)
            .then(res => {
                expect(res).to.be.undefined
            })
            .finally(() => done())
        })

        it('should publish - message handler, application feedback topic', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), `${APP_ID}/message`, true)
            .then(res => {
                storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), 'message')
            })
            .finally(() => done())
        })

        it('should publish - message handler, application deep feedback topic', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), `${APP_ID}/topic/tree/message`, true)
            .then(res => {
                storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), 'topic')
            })
            .finally(() => done())
        })

        it('should publish - message handler, gateway feedback topic', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), `${APP_ID}/${GATEWAY_ID}/message`, true)
            .then(res => {
                storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), GATEWAY_ID.toString())
            })
            .finally(() => done())
        })

        it('should publish - message handler, gateway deep feedback topic', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), `${APP_ID}/${GATEWAY_ID}/topic/tree/message`, true)
            .then(res => {
                storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), GATEWAY_ID.toString())
            })
            .finally(() => done())
        })


        it('should not publish - wrong key', done => {
            exchange.authorizeTopicPublish('wrong', `${APP_ID}/${GATEWAY_ID}/test`, true)
            .catch(err => {
                err.should.be.an('error')
            })
            .finally(() => done())
        })

        it('should not publish - wrong rule', done => {
            exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/non/existent/topic`, true)
            .catch(err => {
                logger.warn(err.message)
                err.should.be.an('error')
            })
            .finally(() => done())
        })

        it('should publish - application feedback channel', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/message`, true)
            .then(() => {
                storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), 'message')
            })
            .finally(() => done())
        })

        it('should publish - gateway feedback channel', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/message`, true)
            .then(() => {
                storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), GATEWAY_ID.toString())
            })
            .finally(() => done())
        })

        it('should publish and not track - gateway feedback channel', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/message`, false)
            .then(() => {
                storeStatsSpy.should.not.have.been.called
            })
            .finally(() => done())
        })

        it('should publish - registered topic', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`, true)
            .then((direction) => {
                direction.should.equal('in')
                storeStatsSpy.should.have.been.calledWith('in', APP_ID.toString(), GATEWAY_ID.toString())
            })
            .finally(() => done())
        })

        it('should publish and not track - registered topic', done => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`, false)
            .then((direction) => {
                direction.should.equal('in')
                storeStatsSpy.should.not.have.been.called
            })
            .finally(() => done())
        })

    })

    /* ============================
     * SUBSCRIBE SUITE
     * ============================
     */

    describe('Subscribe', function() {

        it('should subscribe - message handler', done => {
            exchange.authorizeTopicSubscribe(nconf.get('HANDLER_KEY'), 'test-topic')
            .then(res => {
                res.should.be.a('string')
                res.should.equal('message handler')
            })
            .finally(() => done())
        })

        it('should subscribe - own topic', done => {
            exchange.authorizeTopicSubscribe(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .then(res => {
                res.should.be.a('string')
                res.should.equal('own topic')
            })
            .finally(() => done())
        })

        it('should subscribe - wrong key', done => {
            exchange.authorizeTopicSubscribe('wrong', `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
            })
            .finally(() => done())
        })

    })

})
