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

        before(done => {
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
            Promise.all([ cleanDb(), createUsers(), Setting.insertMany(settings) ])
            .then(res => done())
        })

        it('should get all settings', done => {
            request(app)
            .get('/api/settings')
            .set('Authorization', adminAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.length.should.equal(2)
                res.body.data.forEach(u => {
                    u.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
                    u.key.should.be.a('string')
                    u.description.should.be.a('string')
                    u.updated.should.be.a('string')
                    u.readOnly.should.be.a('boolean')
                })
                done()
            })
        })

        it('should not get all settings - insufficient credentials', done => {
            request(app)
            .get('/api/settings')
            .set('Authorization', userAuthorization)
            .expect(403, done)
        })

        it('should not get all settings - db error', done => {
            const settingStub = sinon.stub(Setting, 'find').rejects(new Error('setting-find'))
            request(app)
            .get('/api/settings')
            .set('Authorization', adminAuthorization)
            .expect(500)
            .end((err, res) => {
                settingStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })

    /* ============================
     * PUT SETTINGS
     * ============================
     */

    describe('Put settings', function() {

        before(done => {
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
            Promise.all([ cleanDb(), createUsers(), Setting.insertMany(settings) ])
            .then(res => done())
        })

        it('should update settings', done => {
            request(app)
            .put('/api/settings/scope.mutable.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
                res.body.data.key.should.be.a('string')
                res.body.data.description.should.be.a('string')
                res.body.data.updated.should.be.a('string')
                res.body.data.readOnly.should.be.a('boolean')
                done()
            })
        })

        it('should not update settings - insufficient credentials', done => {
            request(app)
            .put('/api/settings/scope.mutable.setting')
            .set('Authorization', userAuthorization)
            .send({ value: 'new value' })
            .expect(403, done)
        })

        it('should not update settings - immutable setting', done => {
            request(app)
            .put('/api/settings/scope.immutable.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })
            .expect(500, done)
        })

        it('should not update settings - does not exist', done => {
            request(app)
            .put('/api/settings/scope.dummy.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })
            .expect(500, done)
        })

        it('should not update settings - db error', done => {
            const settingStub = sinon.stub(Setting, 'findOne').rejects(new Error('setting-find'))
            request(app)
            .put('/api/settings/scope.mutable.setting')
            .set('Authorization', adminAuthorization)
            .send({ value: 'new value' })
            .expect(500)
            .end((err, res) => {
                settingStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })


    /* ============================
     * AWS BRIDGE ENABLING
     * ============================
     */

    describe('AWS bridge enabling', function() {

        before(done => {
            let settings = [
                { description: 'aws', key: 'bridge.aws.enabled', value: false, },
                { description: 'aws', key: 'bridge.aws.endpoint', value: 'A', },
                { description: 'aws', key: 'bridge.aws.certificate', value: 'B', },
                { description: 'aws', key: 'bridge.aws.publickey', value: 'C', },
                { description: 'aws', key: 'bridge.aws.privatekey', value: 'D', },
                { description: 'aws', key: 'bridge.aws.ca', value: 'E', },
            ]
            Promise.all([ cleanDb(), createUsers(), Setting.insertMany(settings) ])
            .then(res => done())
        })

        it('should enable AWS bridge', done => {
            request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: true })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
                res.body.data.key.should.equal('bridge.aws.enabled')
                res.body.data.value.should.equal(true)
                done()
            })
        })

        it('should disable AWS bridge', done => {
            request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: false })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.should.have.all.keys('key', 'value', 'description', 'updated', 'readOnly')
                res.body.data.key.should.equal('bridge.aws.enabled')
                res.body.data.value.should.equal(false)
                done()
            })
        })

        it('should not disable AWS bridge - db error', done => {
            const settingStub = sinon.stub(Setting.prototype, 'save').rejects(new Error('setting-save'))
            request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: false })
            .expect(500)
            .end((err, res) => {
                settingStub.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not enable AWS bridge - missing settings', done => {
            const settingStub = sinon.stub(Setting, 'count').resolves(4)
            request(app)
            .put('/api/settings/bridge.aws.enabled')
            .set('Authorization', adminAuthorization)
            .send({ value: true })
            .expect(500)
            .end((err, res) => {
                settingStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })

})
