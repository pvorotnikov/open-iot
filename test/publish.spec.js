const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const rewire = require('rewire')

const hat = require('hat')

const { cleanDb, expressApp } = require('./_utils')

const { utils } = require('../src/lib')
const { User, Application, ACCESS_LEVEL } = require('../src/models')
const publish = rewire('../src/publish')

describe('Publish', function() {

    const app = expressApp([publish])

    /* ============================
     * PUBLISH MESSAGE
     * ============================
     */

    describe('Publish message', function() {

        let user, application
        let originalSendMessage, sendMessageMock
        let userAuthorization

        before(async () => {
            await cleanDb()
            user = await new User({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@test.com',
                password: utils.generatePassword('test'),
            }).save()
            application = await new Application({
                user: user._id,
                name: 'Test app',
                alias: 'testapp',
                description: 'test app description',
                key: hat(32),
                secret: hat(64),
            }).save()
            originalSendMessage = publish.__get__('sendMessage')
            userAuthorization = `Basic ${Buffer.from(
                `${application.key}:${application.secret}`
            ).toString('base64')}`
        })

        after(async () => {
            await cleanDb()
        })

        beforeEach(() => {
            sendMessageMock = sinon.mock()
            publish.__set__('sendMessage', sendMessageMock)
        })

        afterEach(() => {
            publish.__set__('sendMessage', originalSendMessage)
        })



        it('should publish JSON message with default QoS', async () => {

            sendMessageMock.once().resolves()

            const res = await request(app)
            .post('/api/publish/appid/gwid/test/topic')
            .set('Authorization', userAuthorization)
            .send({ foo: 'bar' })

            sendMessageMock.verify()
            res.status.should.equal(200)
        })

        it('should publish JSON message with QoS=1', async () => {

            sendMessageMock.once().resolves()

            const res = await request(app)
            .post('/api/publish/appid/gwid/test/topic?qos=1')
            .set('Authorization', userAuthorization)
            .send({ foo: 'bar' })

            sendMessageMock.verify()
            res.status.should.equal(200)
        })

        it('should not publish message - send error', async () => {

            sendMessageMock.once().rejects()

            const res = await request(app)
            .post('/api/publish/appid/gwid/test/topic?qos=1')
            .set('Authorization', userAuthorization)
            .send({ foo: 'bar' })

            sendMessageMock.verify()
            res.status.should.equal(500)

        })

    })

})
