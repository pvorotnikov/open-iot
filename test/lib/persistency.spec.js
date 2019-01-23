const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { cleanDb, objectId, logger, } = require('../_utils')

const models = require('../../src/models')
const persistency = rewire('../../src/lib/persistency')

describe('Persistency', function() {

    before(async () => {
        await cleanDb()
    })

    after(async () => {
        await cleanDb()
    })

    /* ============================
     * STORE MESSAGE SUITE
     * ============================
     */

    describe('Store message', function() {

        it('persist gateway scoped message', async () => {

            const messageSpy = sinon.spy(models, 'Message')

            const appId = objectId().toString()
            const gwId = objectId().toString()
            const topic = 'topic'
            const payload = 'payload'
            await persistency.storeMessage(`${appId}/${gwId}/${topic}`, payload)

            messageSpy.restore()

            messageSpy.should.have.been.calledWithNew
            const args = messageSpy.getCall(0).args
            args[0].topic.should.equal(topic)
            args[0].gateway.should.equal(gwId)
            args[0].application.should.equal(appId)
            args[0].payload.should.equal(payload)
        })

        it('persist application scoped message on shallow topic', async () => {

            const messageSpy = sinon.spy(models, 'Message')

            const appId = objectId().toString()
            const topic = 'topic'
            const payload = 'payload'
            await persistency.storeMessage(`${appId}/${topic}`, payload)

            messageSpy.restore()

            messageSpy.should.have.been.calledWithNew
            const args = messageSpy.getCall(0).args
            args[0].topic.should.equal(topic)
            args[0].application.should.equal(appId)
            args[0].payload.should.equal(payload)
            should.equal(args[0].gateway, null)
        })

        it('persist application scoped message on deep topic', async () => {

            const messageSpy = sinon.spy(models, 'Message')

            const appId = objectId().toString()
            const topic = 'topic/topic2/topic3'
            const payload = 'payload'
            await persistency.storeMessage(`${appId}/${topic}`, payload)

            messageSpy.restore()

            messageSpy.should.have.been.calledWithNew
            const args = messageSpy.getCall(0).args
            args[0].topic.should.equal(topic)
            args[0].application.should.equal(appId)
            args[0].payload.should.equal(payload)
            should.equal(args[0].gateway, null)
        })

        it('should not persist message - db error', async () => {

            const loggerSpy = sinon.spy(logger, 'error')
            const messageStub = sinon.stub(models, 'Message').returns({
                save: sinon.stub().rejects(new Error('DB Error'))
            })

            const appId = objectId().toString()
            const gwId = objectId().toString()
            const topic = 'topic'
            const payload = 'payload'
            await persistency.storeMessage(`${appId}/${gwId}/${topic}`, payload)

            messageStub.restore()
            loggerSpy.restore()

            messageStub.should.have.been.calledWithNew
            loggerSpy.should.have.been.calledOnce
        })

    })

})
