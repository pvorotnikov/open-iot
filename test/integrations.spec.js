const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const mongoose = require('mongoose')

const { cleanDb, expressApp, logger } = require('./_utils')

const { utils } = require('../src/lib')
const { User, Module, Integration, ACCESS_LEVEL } = require('../src/models')
const integrations = require('../src/integrations')

describe('Integrations', function() {

    const app = expressApp([integrations])
    let managerAuthorization

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
                managerAuthorization = 'Basic ' + Buffer.from(user.key + ':' + user.secret).toString('base64')
                fulfill(user)
            })
            .catch(err => reject(err))
        })
    }

    /* ============================
     * INTEGRATION LIST
     * ============================
     */

    describe('Integration list', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createManager() ])
        })

        it('should fetch all integrations', done => {

            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' } },
                    { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
                ]
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('find').chain('where').withArgs('user').chain('eq').resolves([ mockedIntegration ])

            request(app)
            .get('/api/integrations')
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                res.body.data.should.be.an('array')
                res.body.data.length.should.equal(1)
                res.body.data[0].should.have.all.keys('created', 'updated', 'topic', 'pipeline', 'id', 'status')
                res.body.data[0].created.should.be.a('string')
                res.body.data[0].updated.should.be.a('string')
                res.body.data[0].id.should.be.a('string')
                res.body.data[0].status.should.equal('enabled')
                res.body.data[0].topic.should.equal('test-topic')
                res.body.data[0].pipeline.should.be.an('array')
                res.body.data[0].pipeline.length.should.equal(2)
                res.body.data[0].pipeline[0].should.have.all.keys('module', 'status', 'arguments')
                res.body.data[0].pipeline[0].module.should.be.a('string')
                res.body.data[0].pipeline[0].status.should.be.a('string')
                res.body.data[0].pipeline[0].arguments.should.be.an('object')
                done()
            })
        })

        it('should not fetch integrations - db error', done => {
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('find').chain('where').withArgs('user').chain('eq').rejects(new Error('integration-find'))

            request(app)
            .get('/api/integrations')
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                res.body.status.should.equal('error')
                res.body.errorMessage.should.equal('integration-find')
                done()
            })
        })

    })

    /* ============================
     * CREATE INTEGRATION
     * ============================
     */

    describe('Create integration', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createManager() ])
        })

        it('should create integration', done => {

            let pipeline = [
                { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' } },
                { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
            ]

            request(app)
            .post('/api/integrations')
            .send({ topic: 'test-topic', pipeline: pipeline })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.data.should.have.all.keys('created', 'updated', 'topic', 'pipeline', 'id', 'status')
                res.body.data.created.should.be.a('string')
                res.body.data.updated.should.be.a('string')
                res.body.data.id.should.be.a('string')
                res.body.data.status.should.equal('enabled')
                res.body.data.topic.should.equal('test-topic')
                res.body.data.pipeline.should.be.an('array')
                res.body.data.pipeline.length.should.equal(2)
                done()
            })
        })

        it('should not create integration - missing topic', done => {
            request(app)
            .post('/api/integrations')
            .send({ pipeline: [] })
            .set('Authorization', managerAuthorization)
            .expect(400, done)
        })

        it('should not create integration - db error', done => {
            const integrationStub = sinon.stub(Integration.prototype, 'save').rejects(new Error('integration-save'))
            request(app)
            .post('/api/integrations')
            .send({ topic: 'test-topic', pipeline: [] })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })


    /* ============================
     * DELETE INTEGRATION
     * ============================
     */

    describe('Delete integration', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createManager() ])
        })

        it('should delete integration', done => {

            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' } },
                    { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
                ]
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            request(app)
            .delete('/api/integrations/' + mockedIntegration._id)
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not delete integration - missing integration', done => {

            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(null)

            request(app)
            .delete('/api/integrations/' + new mongoose.mongo.ObjectId())
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not delete integration - db error', done => {

            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').rejects(new Error('db-error'))

            request(app)
            .delete('/api/integrations/' + new mongoose.mongo.ObjectId())
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

    })

    /* ============================
     * ENABLE/DISABLE INTEGRATION
     * ============================
     */

    describe('Enable/disable integration', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createManager() ])
        })

        it('should enable integration', done => {

            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' } },
                    { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
                ],
                status: 'disabled',
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            request(app)
            .put('/api/integrations/' + mockedIntegration._id)
            .send({ status: 'enabled' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                res.body.data.status.should.equal('enabled')
                done()
            })
        })

        it('should disable integration', done => {

            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' } },
                    { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            request(app)
            .put('/api/integrations/' + mockedIntegration._id)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                res.body.data.status.should.equal('disabled')
                done()
            })
        })

        it('should not disable integration - missing integration', done => {

            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(null)

            request(app)
            .put('/api/integrations/' + new mongoose.mongo.ObjectId())
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not delete integration - db error', done => {

            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').rejects(new Error('db-error'))

            request(app)
            .put('/api/integrations/' + new mongoose.mongo.ObjectId())
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

    })

    /* ============================
     * ENABLE/DISABLE INTEGRATION STEP
     * ============================
     */

    describe('Enable/disable integration step', function() {

        before(done => {
            Promise.all([ cleanDb(), createManager() ])
            .then(res => done()).catch(err => done(err))
        })

        it('should enable integration step', done => {

            const mockedModule = new Module({ name: 'com.example.test-module', description: '', meta: {}, status: 'enabled' })
            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: mockedModule._id, arguments: { foo: 'bar' }, status: 'disabled' },
                    { module: mockedModule._id, arguments: { bar: 'baz' }, status: 'disabled' }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            const moduleMock = sinon.mock(Module)
            moduleMock.expects('findById').resolves(mockedModule)

            request(app)
            .put(`/api/integrations/${mockedIntegration._id}/0`)
            .send({ status: 'enabled' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                moduleMock.verify()
                moduleMock.restore()
                if (err) return done(err)
                res.body.data.pipeline[0].status.should.equal('enabled')
                res.body.data.pipeline[1].status.should.equal('disabled')
                done()
            })
        })

        it('should disable integration step', done => {

            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' } },
                    { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            request(app)
            .put(`/api/integrations/${mockedIntegration._id}/1`)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                res.body.data.pipeline[0].status.should.equal('enabled')
                res.body.data.pipeline[1].status.should.equal('disabled')
                done()
            })
        })

        it('should not enable integration step', done => {

            const mockedModule = new Module({ name: 'com.example.test-module', description: '', meta: {}, status: 'disabled' })
            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: mockedModule._id, arguments: { foo: 'bar' }, status: 'disabled' },
                    { module: mockedModule._id, arguments: { bar: 'baz' }, status: 'disabled' }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            const moduleMock = sinon.mock(Module)
            moduleMock.expects('findById').resolves(mockedModule)

            request(app)
            .put(`/api/integrations/${mockedIntegration._id}/0`)
            .send({ status: 'enabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                moduleMock.verify()
                moduleMock.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not disable integration step - missing integration', done => {

            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(null)

            request(app)
            .put(`/api/integrations/${new mongoose.mongo.ObjectId()}/0`)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not disable integration step - wrong integration step', done => {

            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' } },
                    { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            request(app)
            .put(`/api/integrations/${mockedIntegration._id}/2`)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not enable integration step - missing module', done => {

            const mockedIntegration = new Integration({
                user: new mongoose.mongo.ObjectId(),
                topic: 'test-topic',
                pipeline: [
                    { module: new mongoose.mongo.ObjectId(), arguments: { foo: 'bar' }, status: 'missing' },
                    { module: new mongoose.mongo.ObjectId(), arguments: { bar: 'baz' } }
                ],
            })
            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').resolves(mockedIntegration)

            request(app)
            .put(`/api/integrations/${mockedIntegration._id}/0`)
            .send({ status: 'enabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })

        it('should not disable integration step - db error', done => {

            const integrationMock = sinon.mock(Integration)
            integrationMock.expects('findById').chain('where').withArgs('user').chain('eq').rejects(new Error('db-error'))

            request(app)
            .put(`/api/integrations/${new mongoose.mongo.ObjectId()}/0`)
            .send({ status: 'disabled' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                integrationMock.verify()
                integrationMock.restore()
                if (err) return done(err)
                done()
            })
        })


    })

})
