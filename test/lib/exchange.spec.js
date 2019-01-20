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

    before(async () => {
        await cleanDb()
        await Promise.all([

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

    after(async () => {
        await cleanDb()
    })

    /* ============================
     * NEW CONNECTION SUITE
     * ============================
     */

    describe('New connection', function() {

        it('should not authenticate app - does not exist', async () => {
            await exchange.authenticateApp(null, null)
            .should.be.rejectedWith(Error, 'Invalid key or secret')
        })

        it('should not authenticate app - wrong key', async () => {
            await exchange.authenticateApp('wrong', APP_SECRET)
            .should.be.rejectedWith(Error, 'Invalid key or secret')
        })

        it('should not authenticate app - wrong secret', async () => {
            await exchange.authenticateApp(APP_KEY, 'wrong')
            .should.be.rejectedWith(Error, 'Invalid key or secret')
        })

        it('should not authenticate app - db error', async () => {

            const ApplicationMock = sinon.mock(Application)
            ApplicationMock
            .expects('findOne')
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .chain('where').withArgs('secret')
            .chain('eq').withArgs(APP_SECRET)
            .rejects(new Error('Forced reject'))

            await exchange.authenticateApp(APP_KEY, APP_SECRET)
            .should.be.rejectedWith(Error, 'Forced reject')

            ApplicationMock.verify()
            ApplicationMock.restore()
        })

        it('should authenticate app', async () => {
            const res = await exchange.authenticateApp(APP_KEY, APP_SECRET)
            res.should.be.a('string')
            res.should.equal('Test')

        })

        it('should authenticate app - message handler', async () => {
            const res = await exchange.authenticateApp(nconf.get('HANDLER_KEY'), nconf.get('HANDLER_SECRET'))
            res.should.be.a('string')
            res.should.equal('Message Handler')
        })

    })

    /* ============================
     * PUBLISH SUITE
     * ============================
     */

    describe('Publish (rules)', function() {

        const storeStats = exchange.__get__('storeStats')

        afterEach(() => {
            exchange.__set__('storeStats', storeStats)
        })

        it('should publish - message handler, regular topic', async () => {
            const res = await exchange.authorizeTopicPublish(nconf.get('HANDLER_KEY'), 'test', true)
            expect(res).to.equal('Message Handler')
        })

        it('should publish - message handler, application feedback topic', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            const res = await exchange.authorizeTopicPublish(
                nconf.get('HANDLER_KEY'), `${APP_ID}/message`, true)
            storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), 'message')
        })

        it('should publish - message handler, application deep feedback topic', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            const res = await exchange.authorizeTopicPublish(
                nconf.get('HANDLER_KEY'), `${APP_ID}/topic/tree/message`, true)
            storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), 'topic')
        })

        it('should publish - message handler, gateway feedback topic', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            const res = await exchange.authorizeTopicPublish(
                nconf.get('HANDLER_KEY'), `${APP_ID}/${GATEWAY_ID}/message`, true)
            storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), GATEWAY_ID.toString())
        })

        it('should publish - message handler, gateway deep feedback topic', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            const res = await exchange.authorizeTopicPublish(
                nconf.get('HANDLER_KEY'), `${APP_ID}/${GATEWAY_ID}/topic/tree/message`, true)
            storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), GATEWAY_ID.toString())
        })


        it('should not publish - wrong key', async () => {
            await exchange.authorizeTopicPublish('wrong', `${APP_ID}/${GATEWAY_ID}/test`, true)
            .should.be.rejectedWith(Error)
        })

        it('should not publish - wrong rule', async () => {
            await exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/non/existent/topic`, true)
            .should.be.rejectedWith(Error)

        })

        it('should not publish - db error', async () => {

            const ApplicationMock = sinon.mock(Application)
            ApplicationMock
            .expects('findById').withArgs(APP_ID.toString())
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .rejects(new Error('Forced reject'))

            await exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .should.be.rejectedWith(Error, 'Forced reject')

            ApplicationMock.verify()
            ApplicationMock.restore()

        })

        it('should publish - application feedback channel', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            await exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/message`, true)
            storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), 'message')
        })

        it('should publish - gateway feedback channel', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            await exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/message`, true)
            storeStatsSpy.should.have.been.calledWith('out', APP_ID.toString(), GATEWAY_ID.toString())
        })

        it('should publish and not track - gateway feedback channel', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            await exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/message`, false)
            storeStatsSpy.should.not.have.been.called

        })

        it('should publish - registered topic', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            const direction = await exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`, true)
            direction.should.equal('Test')
            storeStatsSpy.should.have.been.calledWith('in', APP_ID.toString(), GATEWAY_ID.toString())
        })

        it('should publish and not track - registered topic', async () => {

            const storeStatsSpy = sinon.spy(storeStats)
            exchange.__set__('storeStats', storeStatsSpy)

            const direction = await exchange.authorizeTopicPublish(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`, false)
            direction.should.equal('Test')
            storeStatsSpy.should.not.have.been.called
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
                res.should.equal('Message Handler')
                done()
            })
            .catch(err => done(err))
        })

        it('should publish - registered topic', done => {
            exchange.authorizeTopicPublishIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .then(res => {
                res.should.equal('Test')
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

    describe('Subscribe (rules)', function() {

        it('should subscribe - message handler', async () => {
            const res = await exchange.authorizeTopicSubscribe(nconf.get('HANDLER_KEY'), 'test-topic')
            res.should.be.a('string')
            res.should.equal('Message Handler')
        })

        it('should subscribe - own topic', async () => {
            const res = await exchange.authorizeTopicSubscribe(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            res.should.be.a('string')
            res.should.equal('Test')
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

        it('should subscribe - message handler', async () => {
            const res = await exchange.authorizeTopicSubscribeIntegrations(nconf.get('HANDLER_KEY'), 'test-topic')
            res.should.be.a('string')
            res.should.equal('Message Handler')
        })

        it('should subscribe - registered topic (gateway level)', async () => {
            const res = await exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            res.should.be.a('string')
            res.should.equal('Test')
        })

        it('should subscribe - registered top-level topic (application level)', async () => {
            const res = await exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/test`)
            res.should.be.a('string')
            res.should.equal('Test')
        })

        it('should subscribe - registered second-level topic (application level)', async () => {
            const IntegrationMock = sinon.mock(Integration)
            IntegrationMock.expects('findOne').resolves({})

            const res = await exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/test/test`)
            res.should.be.a('string')
            res.should.equal('Test')

            IntegrationMock.verify()
            IntegrationMock.restore()
        })

        it('should not subscribe - wrong key', async () => {
            await exchange.authorizeTopicSubscribeIntegrations('wrong', `${APP_ID}/${GATEWAY_ID}/test`)
            .should.be.rejectedWith(Error, 'Application id and key do not match')
        })

        it('should not subscribe - unknown topic', async () => {
            await exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test-topic`)
            .should.be.rejectedWith(Error)
        })

        it('should not subscribe - unknown app', async () => {
            await exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${objectId()}/${GATEWAY_ID}/test`)
            .should.be.rejectedWith(Error, 'Application id and key do not match')
        })

        it('should not subscribe - db error in Application', async () => {

            const ApplicationMock = sinon.mock(Application)
            ApplicationMock
            .expects('findById').withArgs(APP_ID.toString())
            .chain('where').withArgs('key')
            .chain('eq').withArgs(APP_KEY)
            .rejects(new Error('Forced reject'))

            await exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .should.be.rejectedWith(Error, 'Forced reject')

            ApplicationMock.verify()
            ApplicationMock.restore()
        })

        it('should not subscribe - db error in Integration', async () => {

            const IntegrationMock = sinon.mock(Integration)

            IntegrationMock
            .expects('findOne')
            .rejects(new Error('Forced reject'))

            await exchange.authorizeTopicSubscribeIntegrations(APP_KEY, `${APP_ID}/${GATEWAY_ID}/test`)
            .should.be.rejectedWith(Error, 'Forced reject')

            IntegrationMock.verify()
            IntegrationMock.restore()
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
            applicationUpdateStub = sinon.stub(Application, 'findOneAndUpdate').resolves()
            gatewayUpdateStub = sinon.stub(Gateway, 'findOneAndUpdate').resolves()
        })

        afterEach(() => {
            applicationUpdateStub.restore()
            gatewayUpdateStub.restore()
        })

        it('should record ingress for app and gateway', async () => {
            await storeStats('in', APP_ID, GATEWAY_ID)
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsIn: 1 } })
            gatewayUpdateStub.should.have.been.calledOnce
            gatewayUpdateStub.should.have.been.calledWith(GATEWAY_ID, { $inc: { statsIn: 1 } })
        })

        it('should record egress for app and gateway', async () => {
            await storeStats('out', APP_ID, GATEWAY_ID)
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsOut: 1 } })
            gatewayUpdateStub.should.have.been.calledOnce
            gatewayUpdateStub.should.have.been.calledWith(GATEWAY_ID, { $inc: { statsOut: 1 } })
        })

        it('should record egress only for app', async () => {
            await storeStats('out', APP_ID, 'message')
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsOut: 1 } })
            gatewayUpdateStub.should.not.have.been.called
        })

        it('should record egress only for app - deep topic', async () => {
            await storeStats('out', APP_ID, 'topic/tree/message')
            applicationUpdateStub.should.have.been.calledOnce
            applicationUpdateStub.should.have.been.calledWith(APP_ID, { $inc: { statsOut: 1 } })
            gatewayUpdateStub.should.not.have.been.called
        })

        it('should not record anything', async () => {
            await storeStats(null, APP_ID, GATEWAY_ID)
            applicationUpdateStub.should.not.have.been.called
            gatewayUpdateStub.should.not.have.been.called
        })

        it('should not record ingress - db error', async () => {
            // restore in order to wrap the rejects
            applicationUpdateStub.restore()
            gatewayUpdateStub.restore()
            applicationUpdateStub = sinon.stub(Application, 'findOneAndUpdate').rejects(new Error('Forced reject'))
            gatewayUpdateStub = sinon.stub(Gateway, 'findOneAndUpdate').rejects(new Error('Forced reject'))

            await storeStats('in', APP_ID, GATEWAY_ID)
        })

        it('should not record egress - db error', async () => {
            // restore in order to wrap the rejects
            applicationUpdateStub.restore()
            gatewayUpdateStub.restore()
            applicationUpdateStub = sinon.stub(Application, 'findOneAndUpdate').rejects(new Error('Forced reject'))
            gatewayUpdateStub = sinon.stub(Gateway, 'findOneAndUpdate').rejects(new Error('Forced reject'))

            await storeStats('out', APP_ID, GATEWAY_ID)
        })

    })

})
