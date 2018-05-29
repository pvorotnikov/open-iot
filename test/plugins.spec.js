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
const { User, Plugin, ACCESS_LEVEL } = require('../src/models')
const plugins = require('../src/plugins')

describe('Plugins', function() {

    let app
    let userAuthorization, adminAuthorization

    function createUsers() {
        return new Promise((fulfill, reject) => {
            User.insertMany([
                {
                    firstName: 'User',
                    lastName: 'User',
                    email: 'user',
                    password: utils.generatePassword('user'),
                },
                {
                    firstName: 'Admin',
                    lastName: 'Admin',
                    email: 'admin',
                    password: utils.generatePassword('admin'),
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
        app = expressApp([plugins])
    })

    /* ============================
     * GET PLUGINS
     * ============================
     */

    describe('Get plugins', function() {

        before(done => {
            let plugins = [
                {
                    name: 'com.example.plugin1',
                    description: 'Plugin 1',
                },
                {
                    name: 'com.example.plugin2',
                    description: 'Plugin 2',
                }
            ]
            Promise.all([ cleanDb(), createUsers(), Plugin.insertMany(plugins) ])
            .then(res => done())
        })

        it('should not get all plugins - insufficient credentials', done => {
            request(app)
            .get('/api/plugins')
            .set('Authorization', userAuthorization)
            .expect(403, done)
        })

        it('should not get all plugins - db error', done => {
            const pluginStub = sinon.stub(Plugin, 'find').rejects(new Error('plugin-find'))
            request(app)
            .get('/api/plugins')
            .set('Authorization', adminAuthorization)
            .expect(500)
            .end((err, res) => {
                pluginStub.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should get all plugins', done => {
            request(app)
            .get('/api/plugins')
            .set('Authorization', adminAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.length.should.equal(2)
                res.body.data.forEach(p => {
                    p.should.have.all.keys('id', 'name', 'description', 'enabled')
                    p.id.should.be.a('string')
                    p.name.should.be.a('string')
                    p.description.should.be.a('string')
                    p.enabled.should.be.a('boolean')
                })
                done()
            })
        })

    })

    /* ============================
     * CREATE PLUGIN
     * ============================
     */

    describe('Create plugin', function() {

        before(done => {
            Promise.all([ cleanDb(), createUsers() ])
            .then(res => done())
        })

        it('should not create a plugin - insufficient credentials', done => {
            request(app)
            .post('/api/plugins')
            .set('Authorization', userAuthorization)
            .send({ name: 'com.example.plugin1', description: 'Plugin 1' })
            .expect(403, done)
        })

        it('should not create a plugin - db error', done => {
            const pluginStub = sinon.stub(Plugin.prototype, 'save').rejects(new Error('plugin-save'))
            request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .send({ name: 'com.example.plugin1', description: 'Plugin 1' })
            .expect(500)
            .end((err, res) => {
                pluginStub.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not create a plugin - missing name', done => {
            request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .send({ description: 'Plugin 1' })
            .expect(400, done)
        })

        it('should not create a plugin - missing description', done => {
            request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .send({ name: 'com.example.plugin1' })
            .expect(400, done)
        })

        it('should create a plugins', done => {
            request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .send({ name: 'com.example.plugin1', description: 'Plugin 1' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.should.be.an('object')
                res.body.data.should.have.all.keys('id', 'name', 'description', 'enabled')
                res.body.data.id.should.be.a('string')
                res.body.data.name.should.be.a('string')
                res.body.data.description.should.be.a('string')
                res.body.data.enabled.should.be.a('boolean')
                done()
            })
        })

    })

})
