const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const rewire = require('rewire')
const EventEmitter = require('events')

const { cleanDb, expressApp } = require('./_utils')

const { utils } = require('../src/lib')
const { User, ACCESS_LEVEL } = require('../src/models')
const publish = rewire('../src/publish')

describe('Publish', function() {

    const app = expressApp([publish])
    let userAuthorization, adminAuthorization

    async function createUsers() {
        const users = await User.insertMany([
            { firstName: 'User', lastName: 'User', email: 'user', password: utils.generatePassword('user'), },
            { firstName: 'Admin', lastName: 'Admin', email: 'admin', password: utils.generatePassword('admin'), accessLevel: ACCESS_LEVEL.ADMIN, },
        ])
        const [user, admin] = users
        userAuthorization = 'Basic ' + Buffer.from(user.key + ':' + user.secret).toString('base64')
        adminAuthorization = 'Basic ' + Buffer.from(admin.key + ':' + admin.secret).toString('base64')
    }

    /* ============================
     * PUBLISH MESSAGE
     * ============================
     */

    describe('Publish message', function() {

        let originalSendMessage, sendMessageMock

        before(async () => {
            await Promise.all([ cleanDb(), createUsers() ])
            originalSendMessage = publish.__get__('sendMessage')
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
