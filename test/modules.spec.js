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
const { User, Module, Integration, ACCESS_LEVEL } = require('../src/models')
const modules = require('../src/modules')

describe('Modules', function() {

    let app
    let managerAuthorization

    function createModule(name, description, meta, status = 'enabled') {
        return new Promise((fulfill, reject) => {
            new Module({ name, description, meta, status })
            .save()
            .then(m => fulfill(m))
            .catch(err => reject(err))
        })
    }

    function createManager() {
        return new Promise((fulfill, reject) => {
            new User({
                firstName: 'Manager',
                lastName: 'User',
                email: 'manager',
                password: utils.generatePassword('test'),
                accessLevel: ACCESS_LEVEL.MANAGER,
            }).save()
            .then(user => {
                managerAuthorization = 'Basic ' + new Buffer(user.key + ':' + user.secret).toString('base64')
                fulfill(user)
            })
            .catch(err => reject(err))
        })
    }

    before(() => {
        // create app
        app = expressApp([modules])
    })

    /* ============================
     * MODULE LIST
     * ============================
     */

    describe('Module list', function() {

        before(done => {
            Promise.all([ cleanDb(), createManager(), createModule('test.module', 'Test Module', {}) ])
            .then(res => done())
        })

        it('should fetch all modules', done => {
            request(app)
            .get('/api/modules')
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.should.be.an('array')
                res.body.data.length.should.equal(1)
                res.body.data[0].should.have.all.keys('id', 'name', 'description', 'status', 'meta')
                res.body.data[0].id.should.be.a('string')
                res.body.data[0].name.should.equal('test.module')
                res.body.data[0].description.should.equal('Test Module')
                res.body.data[0].meta.should.be.an('object')
                done()
            })
        })

        it('should not fetch modules - db error', done => {
            const moduleStub = sinon.stub(Module, 'find').rejects(new Error('module-find'))
            request(app)
            .get('/api/modules')
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                moduleStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })


    /* ============================
     * ENABLE/DISABLE MODULE
     * ============================
     */

    describe('Enable module', function() {

        let moduleId = null

        before(done => {
            Promise.all([
                cleanDb(),
                createManager(),
                createModule('test.module', 'Test Module', {}).then(m => moduleId = m.id)
            ])
            .then(res => done())
        })

        it('should enable module', done => {

            const mockedIntegration = new Integration({
                topic: 'test-topic',
                pipeline: [
                    { module: moduleId, arguments: { foo: 'bar' } },
                    { module: moduleId, arguments: { bar: 'baz' } }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('find').resolves([mockedIntegration])

            request(app)
            .put('/api/modules/' + moduleId)
            .send({ status: 'enabled' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()

                if (err) return done(err)
                res.body.data.should.have.all.keys('id', 'name', 'description', 'status', 'meta')
                res.body.data.id.should.equal(moduleId)
                res.body.data.name.should.equal('test.module')
                res.body.data.description.should.equal('Test Module')
                res.body.data.status.should.equal('enabled')
                res.body.data.meta.should.be.an('object')
                done()
            })
        })

        it('should disable module', done => {

            const mockedIntegration = new Integration({
                topic: 'test-topic',
                pipeline: [
                    { module: moduleId, arguments: { foo: 'bar' } },
                    { module: moduleId, arguments: { bar: 'baz' } }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('find').resolves([mockedIntegration])

            request(app)
            .put('/api/modules/' + moduleId)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()

                if (err) return done(err)
                res.body.data.should.have.all.keys('id', 'name', 'description', 'status', 'meta')
                res.body.data.id.should.equal(moduleId)
                res.body.data.name.should.equal('test.module')
                res.body.data.description.should.equal('Test Module')
                res.body.data.status.should.equal('disabled')
                res.body.data.meta.should.be.an('object')
                done()
            })
        })

        it('should not update module - db error', done => {
            const moduleStub = sinon.stub(Module, 'findOne').rejects(new Error('module-find-one'))
            request(app)
            .put('/api/modules/' + moduleId)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                moduleStub.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not update module - module does not exist', async () => {
            await Module.deleteOne({ _id: moduleId })
            const res = await request(app)
            .put('/api/modules/' + moduleId)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            res.status.should.equal(404)
        })

    })

})
