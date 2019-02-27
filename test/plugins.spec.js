const _ = require('lodash')
const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const fs = require('fs')

const { cleanDb, expressApp, logger } = require('./_utils')

const { utils } = require('../src/lib')
const { User, Plugin, ACCESS_LEVEL } = require('../src/models')
const plugins = require('../src/plugins')

describe('Plugins', function() {

    const app = expressApp([plugins])
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
     * GET PLUGINS
     * ============================
     */

    describe('Get plugins', function() {

        before(async () => {
            let plugins = [
                { name: 'com.example.plugin1', description: 'Plugin 1', },
                { name: 'com.example.plugin2', description: 'Plugin 2', }
            ]
            await Promise.all([ cleanDb(), createUsers(), Plugin.insertMany(plugins) ])
        })

        it('should not get all plugins - insufficient credentials', async () => {
            const res = await request(app)
            .get('/api/plugins')
            .set('Authorization', userAuthorization)

            res.status.should.equal(403)
            res.body.status.should.equal('error')
        })

        it('should not get all plugins - db error', async () => {
            const pluginStub = sinon.stub(Plugin, 'find').rejects(new Error('plugin-find'))
            const res = await request(app)
            .get('/api/plugins')
            .set('Authorization', adminAuthorization)

            pluginStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
        })

        it('should get all plugins', async () => {
            const res = await request(app)
            .get('/api/plugins')
            .set('Authorization', adminAuthorization)

            res.status.should.equal(200)
            res.body.data.length.should.equal(2)
            res.body.data.forEach(p => {
                p.should.have.all.keys('id', 'name', 'description')
                p.id.should.be.a('string')
                p.name.should.be.a('string')
                p.description.should.be.a('string')
            })
        })

    })

    /* ============================
     * CREATE PLUGIN
     * ============================
     */

    describe('Create plugin', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createUsers() ])
        })

        it('should create a plugins without previous module', async () => {

            // stub fs operations
            const moveStub = sinon.stub(utils, 'move').resolves()
            const unlinkDirStub = sinon.stub(utils, 'unlinkDir').resolves()
            const fileExistsStub = sinon.stub(utils, 'fileExists')
            fileExistsStub.onCall(0).returns(true)
            fileExistsStub.onCall(1).returns(true)
            fileExistsStub.onCall(2).returns(false)

            const res = await request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .set('Content-Type', 'application/zip')
            .send(fs.readFileSync(`${__dirname}/data/com.example.plugin1-v1.0.0.zip`))

            // restore stub
            moveStub.restore()
            fileExistsStub.restore()
            unlinkDirStub.restore()

            moveStub.should.have.been.called
            fileExistsStub.should.have.been.called
            unlinkDirStub.should.not.have.been.called

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.should.have.all.keys('id', 'name', 'description')
            res.body.data.id.should.be.a('string')
            res.body.data.name.should.be.a('string')
            res.body.data.description.should.be.a('string')

        })

        it('should create a plugins with previous module', async () => {

            // stub fs operations
            const moveStub = sinon.stub(utils, 'move').resolves()
            const unlinkDirStub = sinon.stub(utils, 'unlinkDir').resolves()
            const fileExistsStub = sinon.stub(utils, 'fileExists')
            fileExistsStub.onCall(0).returns(true)
            fileExistsStub.onCall(1).returns(true)
            fileExistsStub.onCall(2).returns(true)

            const res = await request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .set('Content-Type', 'application/zip')
            .send(fs.readFileSync(`${__dirname}/data/com.example.plugin1-v1.0.0.zip`))

            // restore stub
            moveStub.restore()
            fileExistsStub.restore()
            unlinkDirStub.restore()

            moveStub.should.have.been.called
            fileExistsStub.should.have.been.called
            unlinkDirStub.should.have.been.called

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.should.have.all.keys('id', 'name', 'description')
            res.body.data.id.should.be.a('string')
            res.body.data.name.should.be.a('string')
            res.body.data.description.should.be.a('string')

        })

        it('should not create a plugins - missing manifest', async () => {

            // stub fs operation
            const fileExistsStub = sinon.stub(utils, 'fileExists')
            fileExistsStub.callsFake(file => !file.endsWith('package.json'))

            const res = await request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .set('Content-Type', 'application/zip')
            .send(fs.readFileSync(`${__dirname}/data/com.example.plugin1-v1.0.0.zip`))

            // restore stub
            fileExistsStub.restore()
            res.status.should.equal(400)

        })

        it('should not create a plugins - missing index', async () => {

            // stub fs operation
            const fileExistsStub = sinon.stub(utils, 'fileExists')
            fileExistsStub.callsFake(file => !file.endsWith('index.js'))

            const res = await request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .set('Content-Type', 'application/zip')
            .send(fs.readFileSync(`${__dirname}/data/com.example.plugin1-v1.0.0.zip`))

            // restore stub
            fileExistsStub.restore()
            res.status.should.equal(400)

        })

        it('should not create a plugins - fs operation failure', async () => {

            // stub fs operations
            const unlinkDirStub = sinon.stub(utils, 'unlinkDir').rejects()
            const fileExistsStub = sinon.stub(utils, 'fileExists').returns(true)

            const res = await request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .set('Content-Type', 'application/zip')
            .send(fs.readFileSync(`${__dirname}/data/com.example.plugin1-v1.0.0.zip`))

            // restore stub
            fileExistsStub.restore()
            unlinkDirStub.restore()
            res.status.should.equal(500)

        })

        it('should not create a plugins - missing name', async () => {

            // stub fs operation
            const fileExistsStub = sinon.stub(utils, 'fileExists').returns(true)
            const isEmptyStub = sinon.stub(_, 'isEmpty').returns(true)

            const res = await request(app)
            .post('/api/plugins')
            .set('Authorization', adminAuthorization)
            .set('Content-Type', 'application/zip')
            .send(fs.readFileSync(`${__dirname}/data/com.example.plugin1-v1.0.0.zip`))

            // restore stub
            isEmptyStub.restore()
            fileExistsStub.restore()
            res.status.should.equal(400)

        })

    })

})
