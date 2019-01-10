const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { cleanDb, expressApp, logger } = require('./_utils')

const { utils } = require('../src/lib')
const { User, Setting, ACCESS_LEVEL } = require('../src/models')
const settings = require('../src/settings')

describe('Settings', function() {

    let app
    let userAuthorization, adminAuthorization

    function createUsers() {
        return new Promise((fulfill, reject) => {
            User.insertMany([
                {
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test',
                    password: utils.generatePassword('test'),
                },
                {
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin',
                    password: utils.generatePassword('test'),
                    accessLevel: ACCESS_LEVEL.ADMIN,
                },
            ])
            .then(users => {
                const [user, admin] = users
                userAuthorization = 'Basic ' + new Buffer(user.key + ':' + user.secret).toString('base64')
                adminAuthorization = 'Basic ' + new Buffer(admin.key + ':' + admin.secret).toString('base64')
                fulfill()
            })
            .catch(err => reject(err))
        })
    }

    before(() => {
        // create app
        app = expressApp([settings])
    })

    /* ============================
     * GET REGISTRATIONS
     * ============================
     */

    describe('Get registrations', function() {

        it('should get registrations', done => {
            const nconfStub = sinon.stub(nconf, 'get').returns(true)
            request(app)
            .get('/api/settings/global.enableregistrations')
            .expect(200)
            .end((err, res) => {
                nconfStub.restore()
                if (err) return done(err)
                res.body.data.value.should.be.a('boolean')
                res.body.data.value.should.equal(true)
                done()
            })
        })

    })

    /* ============================
     * GET SETTINGS
     * ============================
     */

    describe('Get settings', function() {

        before(async () => {
            let settings = [
                {
                    key: 'scope.immutable.setting',
                    value: 'immutable-setting',
                    description: 'Test immutable setting',
                    readOnly: true,
                },
                {
                    key: 'scope.mutable.setting',
                    value: 'mutable-setting',
                    description: 'Test mutable setting',
                }
            ]
            await Promise.all([ cleanDb(), createUsers(), Setting.insertMany(settings) ])
        })

        it('should get all settings', async () => {
            const res = await request(app)
            .get('/api/settings')
            .set('Authorization', adminAuthorization)
            .expect(200)

            res.status.should.equal(200)
            res.body.data.length.should.equal(2)
            res.body.data.forEach(u => {
                u.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
                u.key.should.be.a('string')
                u.description.should.be.a('string')
                u.updated.should.be.a('string')
                u.readOnly.should.be.a('boolean')
            })
        })

        it('should not get all settings - insufficient credentials', async () => {
            const res = await request(app)
            .get('/api/settings')
            .set('Authorization', userAuthorization)

            res.status.should.equal(403)
        })

        it('should not get all settings - db error', async () => {
            const settingStub = sinon.stub(Setting, 'find').rejects(new Error('setting-find'))
            const res = await request(app)
            .get('/api/settings')
            .set('Authorization', adminAuthorization)

            settingStub.restore()
            res.status.should.equal(500)
        })

    })

    /* ============================
     * PUT SETTINGS
     * ============================
     */

    describe('Put settings', function() {

        before(async () => {
            let settings = [
                {
                    key: 'scope.immutable.setting',
                    value: 'immutable-setting',
                    description: 'Test immutable setting',
                    readOnly: true,
                },
                {
                    key: 'scope.mutable.setting',
                    value: 'mutable-setting',
                    description: 'Test mutable setting',
                }
            ]
            await Promise.all([ cleanDb(), createUsers(), Setting.insertMany(settings) ])
        })

        it('should update settings', async () => {
            const res = await request(app)
            .put('/api/settings/scope.mutable.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })

            res.status.should.equal(200)
            res.body.data.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
            res.body.data.key.should.be.a('string')
            res.body.data.description.should.be.a('string')
            res.body.data.updated.should.be.a('string')
            res.body.data.readOnly.should.be.a('boolean')
        })

        it('should not update settings - insufficient credentials', async () => {
            const res = await request(app)
            .put('/api/settings/scope.mutable.setting')
            .set('Authorization', userAuthorization)
            .send({ value: 'new value' })

            res.status.should.equal(403)
        })

        it('should not update settings - immutable setting', async () => {
            const res = await request(app)
            .put('/api/settings/scope.immutable.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })

            res.status.should.equal(500)
        })

        it('should not update settings - does not exist', async () => {
            const res = await request(app)
            .put('/api/settings/scope.dummy.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })

            res.status.should.equal(500)
        })

        it('should not update settings - db error', async () => {
            const settingStub = sinon.stub(Setting, 'findOne').rejects(new Error('setting-find'))
            const res = await request(app)
            .put('/api/settings/scope.mutable.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })

            settingStub.restore()
            res.status.should.equal(500)
        })

    })


    /* ============================
     * AWS BRIDGE ENABLING
     * ============================
     */

    describe('AWS bridge enabling', function() {

        before(async () => {
            let settings = [
                { description: 'aws', key: 'bridge.aws.enabled', value: false, },
                { description: 'aws', key: 'bridge.aws.endpoint', value: 'A', },
                { description: 'aws', key: 'bridge.aws.certificate', value: 'B', },
                { description: 'aws', key: 'bridge.aws.publickey', value: 'C', },
                { description: 'aws', key: 'bridge.aws.privatekey', value: 'D', },
                { description: 'aws', key: 'bridge.aws.ca', value: 'E', },
            ]
            await Promise.all([ cleanDb(), createUsers(), Setting.insertMany(settings) ])
        })

        it('should enable AWS bridge', async () => {
            const res = await request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: true })

            res.status.should.equal(200)
            res.body.data.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
            res.body.data.key.should.equal('bridge.aws.enabled')
            res.body.data.value.should.equal(true)
        })

        it('should disable AWS bridge', async () => {
            const res = await request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: false })

            res.status.should.equal(200)
            res.body.data.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
            res.body.data.key.should.equal('bridge.aws.enabled')
            res.body.data.value.should.equal(false)
        })

        it('should not disable AWS bridge - db error', async () => {
            const settingStub = sinon.stub(Setting.prototype, 'save').rejects(new Error('setting-save'))

            const res = await request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: false })

            settingStub.restore()
            res.status.should.equal(500)
        })

        it('should not enable AWS bridge - missing settings', async () => {
            const settingStub = sinon.stub(Setting, 'countDocuments').resolves(4)

            const res = await request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: true })

            settingStub.restore()
            res.status.should.equal(500)
        })

    })

})
