const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const rewire = require('rewire')

const hat = require('hat')

const { cleanDb, expressApp, objectId } = require('./_utils')

const { utils } = require('../src/lib')
const models = require('../src/models')
const persistency = require('../src/persistency')

describe('Persistency', function() {

    const app = expressApp([persistency])

    /* ============================
     * RETRIEVE MESSAGES
     * ============================
     */

    describe('Retrieve messages', function() {

        let user, application
        let userAuthorization

        before(async () => {
            await cleanDb()
            user = await new models.User({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@test.com',
                password: utils.generatePassword('test'),
            }).save()
            application = await new models.Application({
                user: user._id,
                name: 'Test app',
                alias: 'testapp',
                description: 'test app description',
                key: hat(32),
                secret: hat(64),
            }).save()
            userAuthorization = `Basic ${Buffer.from(
                `${application.key}:${application.secret}`
            ).toString('base64')}`
        })

        after(async () => {
            await cleanDb()
        })

        it('should retrieve messages for :appId/:gwId/test/topic', async () => {

            const appId = objectId().toString()
            const gwId = objectId().toString()

            const response = new models.Message({
                application: appId,
                gateway: gwId,
                topic: 'test/topic',
                payload: Buffer.from('payload')
            })
            const MessageMock = sinon.mock(models.Message)
            MessageMock.expects('find')
            .chain('where').withArgs('application')
            .chain('eq').withArgs(appId)
            .chain('where').withArgs('gateway')
            .chain('eq').withArgs(gwId)
            .chain('where').withArgs('topic')
            .chain('eq').withArgs('test/topic')
            .resolves([response])

            const res = await request(app)
            .get(`/api/persistency/${appId}/${gwId}/test/topic`)
            .set('Authorization', userAuthorization)

            MessageMock.verify()
            MessageMock.restore()

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('array')
        })

        it('should retrieve messages for :appId/test/topic', async () => {

            const appId = objectId().toString()

            const response = new models.Message({
                application: appId,
                gateway: null,
                topic: 'test/topic',
                payload: Buffer.from('payload')
            })

            const MessageMock = sinon.mock(models.Message)
            MessageMock.expects('find')
            .chain('where').withArgs('application')
            .chain('eq').withArgs(appId)
            .chain('where').withArgs('gateway')
            .chain('eq').withArgs(null)
            .chain('where').withArgs('topic')
            .chain('eq').withArgs('test/topic')
            .resolves([response])

            const res = await request(app)
            .get(`/api/persistency/${appId}/test/topic`)
            .set('Authorization', userAuthorization)

            MessageMock.verify()
            MessageMock.restore()

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('array')
        })

        it('should retrieve messages for :appId/topic', async () => {

            const appId = objectId().toString()

            const response = new models.Message({
                application: appId,
                gateway: null,
                topic: 'test/topic',
                payload: Buffer.from('{"foo":"bar"}')
            })

            const MessageMock = sinon.mock(models.Message)
            MessageMock.expects('find')
            .chain('where').withArgs('application')
            .chain('eq').withArgs(appId)
            .chain('where').withArgs('gateway')
            .chain('eq').withArgs(null)
            .chain('where').withArgs('topic')
            .chain('eq').withArgs('topic')
            .resolves([response])

            const res = await request(app)
            .get(`/api/persistency/${appId}/topic`)
            .set('Authorization', userAuthorization)

            MessageMock.verify()
            MessageMock.restore()

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('array')
        })

        it('should retrieve messages for :appId/:gwId', async () => {

            const appId = objectId().toString()
            const gwId = objectId().toString()

            const response = new models.Message({
                application: appId,
                gateway: gwId,
                topic: 'test/topic',
                payload: Buffer.from('payload')
            })

            const MessageMock = sinon.mock(models.Message)
            MessageMock.expects('find')
            .chain('where').withArgs('application')
            .chain('eq').withArgs(appId)
            .chain('where').withArgs('gateway')
            .chain('eq').withArgs(gwId)
            .chain('where').withArgs('topic')
            .chain('eq').withArgs('')
            .resolves([response])

            const res = await request(app)
            .get(`/api/persistency/${appId}/${gwId}`)
            .set('Authorization', userAuthorization)

            MessageMock.verify()
            MessageMock.restore()

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('array')
        })

        it('should retrieve messages for :appId/:gwId/', async () => {

            const appId = objectId().toString()
            const gwId = objectId().toString()

            const response = new models.Message({
                application: appId,
                gateway: gwId,
                topic: 'test/topic',
                payload: Buffer.from('payload')
            })

            const MessageMock = sinon.mock(models.Message)
            MessageMock.expects('find')
            .chain('where').withArgs('application')
            .chain('eq').withArgs(appId)
            .chain('where').withArgs('gateway')
            .chain('eq').withArgs(gwId)
            .chain('where').withArgs('topic')
            .chain('eq').withArgs('')
            .resolves([response])

            const res = await request(app)
            .get(`/api/persistency/${appId}/${gwId}/`)
            .set('Authorization', userAuthorization)

            MessageMock.verify()
            MessageMock.restore()

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('array')
        })

        it('should not retrieve messages - db error', async () => {

            const appId = objectId().toString()

            const MessageMock = sinon.mock(models.Message)
            MessageMock.expects('find')
            .chain('where').withArgs('application')
            .chain('eq').withArgs(appId)
            .chain('where').withArgs('gateway')
            .chain('eq').withArgs(null)
            .chain('where').withArgs('topic')
            .chain('eq').withArgs('topic')
            .rejects(new Error('DB Error'))

            const res = await request(app)
            .get(`/api/persistency/${appId}/topic`)
            .set('Authorization', userAuthorization)

            MessageMock.verify()
            MessageMock.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
        })

    })

})
