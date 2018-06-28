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
const { Application, Gateway, Rule, User, Integration } = require('../../src/models')
const exchange = rewire('../../src/lib/exchange')

describe('Exchange', function() {

    const USER_ID = objectId()
    const APP_ID = objectId()
    const GATEWAY_ID = objectId()
    const RULE_ID = objectId()
    const MODULE_ID = objectId()
    const INTEGRATION_ID = objectId()
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
                }).save(),

                // create integration
                new Integration({
                    _id: INTEGRATION_ID,
                    user: USER_ID,
                    topic: 'test',
                    pipeline: [],
                    status: 'enabled',
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

        it('should not authenticate app - db error', done => {

            const ApplicationMock = sinon.mock(Application)

            ApplicationMock
            .expects('findOne')
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .chain('where').withArgs('secret')
            .chain('eq').withArgs(APP_SECRET)
            .rejects(new Error('Forced reject'))

            exchange.authenticateApp(APP_KEY, APP_SECRET)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Forced reject')
            })
            .finally(() => {
                ApplicationMock.verify()
                ApplicationMock.restore()
                done()
            })
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

        it('should not publish - db error', done => {

            const ApplicationMock = sinon.mock(Application)

            ApplicationMock
            .expects('findById').withArgs(APP_ID.toString())
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .rejects(new Error('Forced reject'))

            exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Forced reject')
            })
            .finally(() => {
                ApplicationMock.verify()
                ApplicationMock.restore()
                done()
            })
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
     * PUBLISH SUITE - INTEGRATIONS
     * ============================
     */

    describe('Publish (integrations)', function() {

        it('should publish - message handler, regular topic', done => {
            exchange.authorizeTopicPublishIntegrations(nconf.get('HANDLER_KEY'), 'test')
            .then(res => {
                res.should.equal('message handler')
                done()
            })
            .catch(err => done(err))
        })

        it('should publish - registered topic', done => {
            exchange.authorizeTopicPublishIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .then(res => {
                res.should.equal('in')
                done()
            })
            .catch(err => done(err))
        })

        it('should not publish - wrong key', done => {
            exchange.authorizeTopicPublishIntegrations('wrong', `${APP_ID}/${GATEWAY_ID}/test`)
            .then(res => {
                done(new Error('Should not resolve'))
            })
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Application id and key do not match')
                done()
            })
        })

        it('should not publish - unknown app', done => {
            exchange.authorizeTopicPublishIntegrations(APP_KEY, `${objectId()}/${GATEWAY_ID}/test-topic`)
            .then(res => {
                done(new Error('Should not resolve'))
            })
            .catch(err => done())
        })

        it('should not publish - unknown topic', done => {
            exchange.authorizeTopicPublishIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test-topic`)
            .then(res => {
                done(new Error('Should not resolve'))
            })
            .catch(err => done())
        })

        it('should not publish - db error in Application', done => {

            const ApplicationMock = sinon.mock(Application)

            ApplicationMock
            .expects('findById').withArgs(APP_ID.toString())
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .rejects(new Error('Forced reject'))

            exchange.authorizeTopicPublishIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Forced reject')
            })
            .finally(() => {
                ApplicationMock.verify()
                ApplicationMock.restore()
                done()
            })
        })

        it('should not publish - db error in Integration', done => {

            const IntegrationMock = sinon.mock(Integration)

            IntegrationMock
            .expects('findOne')
            .rejects(new Error('Forced reject'))

            exchange.authorizeTopicPublishIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Forced reject')
            })
            .finally(() => {
                IntegrationMock.verify()
                IntegrationMock.restore()
                done()
            })
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

        it('should not subscribe - wrong key', done => {
            exchange.authorizeTopicSubscribe('wrong', `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Application id and key do not match')
            })
            .finally(() => done())
        })

        it('should not subscribe - db error', done => {

            const ApplicationMock = sinon.mock(Application)

            ApplicationMock
            .expects('findById').withArgs(APP_ID.toString())
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .rejects(new Error('Forced reject'))

            exchange.authorizeTopicSubscribe(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Forced reject')
            })
            .finally(() => {
                ApplicationMock.verify()
                ApplicationMock.restore()
                done()
            })
        })

    })

    /* ============================
     * SUBSCRIBE SUITE - INTEGRATIONS
     * ============================
     */

    describe('Subscribe (integrations)', function() {

        it('should subscribe - message handler', done => {
            exchange.authorizeTopicSubscribeIntegrations(nconf.get('HANDLER_KEY'), 'test-topic')
            .then(res => {
                res.should.be.a('string')
                res.should.equal('message handler')
                done()
            })
            .catch(err => done(err))
        })

        it('should subscribe - registered topic', done => {
            exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .then(res => {
                res.should.be.a('string')
                res.should.equal('topic registered')
                done()
            })
            .catch(err => done(err))
        })

        it('should not subscribe - wrong key', done => {
            exchange.authorizeTopicSubscribeIntegrations('wrong', `${APP_ID}/${GATEWAY_ID}/test`)
            .then(res => {
                done(new Error('Should not resolve'))
            })
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Application id and key do not match')
                done()
            })
        })

        it('should not subscribe - unknown topic', done => {
            exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test-topic`)
            .then(res => {
                done(new Error('Should not resolve'))
            })
            .catch(err => {
                err.should.be.an('error')
                done()
            })
        })

        it('should not subscribe - unknown app', done => {
            exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${objectId()}/${GATEWAY_ID}/test`)
            .then(res => {
                done(new Error('Should not resolve'))
            })
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Application id and key do not match')
                done()
            })
        })

        it('should not subscribe - db error in Application', done => {

            const ApplicationMock = sinon.mock(Application)

            ApplicationMock
            .expects('findById').withArgs(APP_ID.toString())
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .rejects(new Error('Forced reject'))

            exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Forced reject')
            })
            .finally(() => {
                ApplicationMock.verify()
                ApplicationMock.restore()
                done()
            })
        })

        it('should not subscribe - db error in Integration', done => {

            const IntegrationMock = sinon.mock(Integration)

            IntegrationMock
            .expects('findOne')
            .rejects(new Error('Forced reject'))

            exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .catch(err => {
                err.should.be.an('error')
                err.message.should.equal('Forced reject')
            })
            .finally(() => {
                IntegrationMock.verify()
                IntegrationMock.restore()
                done()
            })
        })

    })

    /* ============================
     * STATS SUITE
     * ============================
     */

    describe('Stats', function() {

        const storeStats = exchange.__get__('storeStats')
        let applicationUpdateStub
        let gatewayUpdateStub

        beforeEach(() => {
            applicationUpdateStub = sinon.stub(Application, 'findByIdAndUpdate').resolves()
            gatewayUpdateStub = sinon.stub(Gateway, 'findByIdAndUpdate').resolves()
        })

        afterEach(() => {
            applicationUpdateStub.restore()
            gatewayUpdateStub.restore()
        })

        it('should record ingress for app and gateway', () => {
            storeStats('in', APP_ID, GATEWAY_ID)
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsIn: 1 } })
            gatewayUpdateStub.should.have.been.calledOnce
            gatewayUpdateStub.should.have.been.calledWith(GATEWAY_ID, { $inc: { statsIn: 1 } })
        })

        it('should record egress for app and gateway', () => {
            storeStats('out', APP_ID, GATEWAY_ID)
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsOut: 1 } })
            gatewayUpdateStub.should.have.been.calledOnce
            gatewayUpdateStub.should.have.been.calledWith(GATEWAY_ID, { $inc: { statsOut: 1 } })
        })

        it('should record egress only for app', () => {
            storeStats('out', APP_ID, 'message')
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsOut: 1 } })
            gatewayUpdateStub.should.not.have.been.called
        })

        it('should record egress only for app - deep topic', () => {
            storeStats('out', APP_ID, 'topic/tree/message')
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsOut: 1 } })
            gatewayUpdateStub.should.not.have.been.called
        })

        it('should not record anything', () => {
            storeStats(null, APP_ID, GATEWAY_ID)
            applicationUpdateStub.should.not.have.been.called
            gatewayUpdateStub.should.not.have.been.called
        })

        it('should not record ingress - db error', (done) => {
            const errorSpy = sinon.spy(logger, 'error')

            // restore in order to wrap the rejects
            applicationUpdateStub.restore()
            gatewayUpdateStub.restore()
            applicationUpdateStub = sinon.stub(Application, 'findByIdAndUpdate').rejects(new Error('Forced reject'))
            gatewayUpdateStub = sinon.stub(Gateway, 'findByIdAndUpdate').rejects(new Error('Forced reject'))

            storeStats('in', APP_ID, GATEWAY_ID)
            setImmediate(() => {
                errorSpy.should.have.been.calledTwice
                errorSpy.firstCall.should.have.been.calledWith('Forced reject')
                errorSpy.secondCall.should.have.been.calledWith('Forced reject')
                errorSpy.restore()
                done()
            })
        })

        it('should not record egress - db error', (done) => {
            const errorSpy = sinon.spy(logger, 'error')

            // restore in order to wrap the rejects
            applicationUpdateStub.restore()
            gatewayUpdateStub.restore()
            applicationUpdateStub = sinon.stub(Application, 'findByIdAndUpdate').rejects(new Error('Forced reject'))
            gatewayUpdateStub = sinon.stub(Gateway, 'findByIdAndUpdate').rejects(new Error('Forced reject'))

            storeStats('out', APP_ID, GATEWAY_ID)
            setImmediate(() => {
                errorSpy.should.have.been.calledTwice
                errorSpy.firstCall.should.have.been.calledWith('Forced reject')
                errorSpy.secondCall.should.have.been.calledWith('Forced reject')
                errorSpy.restore()
                done()
            })
        })

    })

})
