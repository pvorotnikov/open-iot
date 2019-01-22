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
const { User, Application, Message, } = require('../src/models')
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
            userAuthorization = `Basic ${Buffer.from(
                `${application.key}:${application.secret}`
            ).toString('base64')}`
        })

        after(async () => {
            await cleanDb()
        })


        it('should Retrieve messages', async () => {

            const res = await request(app)
            .get('/api/persistency/appid/gwid/test/topic')
            .set('Authorization', userAuthorization)

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('array')
        })

    })

})
