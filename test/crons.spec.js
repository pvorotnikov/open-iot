const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { cleanDb, expressApp, objectId, protectMock, } = require('./_utils')

const { Cron } = require('../src/models')
const auth = require('../src/lib/auth')
const crons = require('../src/crons')


describe('Crons', function() {

    function fakeCron(cron={}) {
        return new Cron({ user: objectId(), cron: '* * * * * *', ...cron, })
    }


    let protectStub
    before(async () => {
        await cleanDb()
        protectStub = sinon.stub(auth, 'protect').returns(protectMock())
    })

    after(async () => {
        protectStub.restore()
        await cleanDb()
    })

    /* ============================
     * GET CRONS
     * ============================
     */
    describe('Get crons', function() {

        it('should get all crons', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves([fakeCron()]),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .get('/api/crons')

            // restore stubs
            cronStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('array')
            res.body.data.length.should.equal(1)
            res.body.data[0].should.have.all.keys('id', 'cron', 'type', 'arguments', 'next', 'created', 'updated')
            res.body.data[0].id.should.be.a('string')
            res.body.data[0].cron.should.equal('* * * * * *')
            res.body.data[0].type.should.equal('publish')
            res.body.data[0].arguments.should.be.an('object')
            res.body.data[0].next.should.be.a('string')
            res.body.data[0].created.should.be.a('string')
            res.body.data[0].updated.should.be.a('string')
        })

        it('should not get all crons - db error', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .get('/api/crons')

            // restore stubs
            cronStub.restore()

            res.status.should.equal(500)
        })

    })

    /* ============================
     * GET A CRON
     * ============================
     */
    describe('Get a cron', function() {

        it('should get a cron', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeCron()),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .get(`/api/crons/${objectId()}`)

            // restore stubs
            cronStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.should.have.all.keys('id', 'cron', 'type', 'arguments', 'next', 'created', 'updated')
            res.body.data.id.should.be.a('string')
            res.body.data.cron.should.equal('* * * * * *')
            res.body.data.type.should.equal('publish')
            res.body.data.arguments.should.be.an('object')
            res.body.data.next.should.be.a('string')
            res.body.data.created.should.be.a('string')
            res.body.data.updated.should.be.a('string')
        })

        it('should not get a cron - does not exist', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .get(`/api/crons/${objectId()}`)

            // restore stubs
            cronStub.restore()
            res.status.should.equal(400)
        })

        it('should not get a cron - db error', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .get(`/api/crons/${objectId()}`)

            // restore stubs
            cronStub.restore()
            res.status.should.equal(500)
        })

    })

    /* ============================
     * CREATE A CRON
     * ============================
     */
    describe('Create a cron', function() {

        it('should create a cron', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                cron: '0 * * * * *',
                type: 'publish',
                arguments: { topic: 'foo', payload: 'bar' },
            })

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.should.have.all.keys('id', 'cron', 'type', 'arguments', 'next', 'created', 'updated')
            res.body.data.id.should.be.a('string')
            res.body.data.cron.should.equal('0 * * * * *')
            res.body.data.type.should.equal('publish')
            res.body.data.arguments.should.be.an('object')
            res.body.data.next.should.be.a('string')
            res.body.data.created.should.be.a('string')
            res.body.data.updated.should.be.a('string')
        })

        it('should not create a cron - missing cron', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                type: 'publish',
                arguments: { topic: 'foo', payload: 'bar' },
            })
            res.status.should.equal(400)
        })

        it('should not create a cron - missing type', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                cron: '0 * * * * *',
                arguments: { topic: 'foo', payload: 'bar' },
            })
            res.status.should.equal(400)
        })

        it('should not create a cron - missing arguments', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                cron: '0 * * * * *',
                type: 'publish',
            })
            res.status.should.equal(400)
        })

        it('should not create a cron - wrong type', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                cron: '0 * * * * *',
                type: 'foo',
                arguments: { topic: 'foo', payload: 'bar' },
            })
            res.status.should.equal(400)
        })

        it('should not create a cron - no publish topic', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                cron: '0 * * * * *',
                type: 'publish',
                arguments: { payload: 'bar' },
            })
            res.status.should.equal(400)
        })

        it('should not create a cron - no publish payload', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                cron: '0 * * * * *',
                type: 'publish',
                arguments: { topic: 'foo' },
            })
            res.status.should.equal(400)
        })

        it('should not create a cron - invalid cron', async () => {

            const app = expressApp([crons])
            const res = await request(app)
            .post(`/api/crons/`)
            .send({
                cron: 'foobar',
                type: 'publish',
                arguments: { topic: 'foo', payload: 'bar' },
            })
            res.status.should.equal(500)
        })

    })

    /* ============================
     * UPDATE A CRON
     * ============================
     */
    describe('Update a cron', function() {

        it('should update a cron', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeCron()),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .put(`/api/crons/${objectId()}`)
            .send({ cron: '0 * * * * *', })

            // restore stubs
            cronStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.should.have.all.keys('id', 'cron', 'type', 'arguments', 'next', 'created', 'updated')
            res.body.data.id.should.be.a('string')
            res.body.data.cron.should.equal('0 * * * * *')
            res.body.data.type.should.equal('publish')
            res.body.data.arguments.should.be.an('object')
            res.body.data.next.should.be.a('string')
            res.body.data.created.should.be.a('string')
            res.body.data.updated.should.be.a('string')
        })

        it('should update a cron - no change', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeCron()),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .put(`/api/crons/${objectId()}`)
            .send({ })

            // restore stubs
            cronStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.should.have.all.keys('id', 'cron', 'type', 'arguments', 'next', 'created', 'updated')
            res.body.data.id.should.be.a('string')
            res.body.data.cron.should.equal('* * * * * *')
            res.body.data.type.should.equal('publish')
            res.body.data.arguments.should.be.an('object')
            res.body.data.next.should.be.a('string')
            res.body.data.created.should.be.a('string')
            res.body.data.updated.should.be.a('string')
        })

        it('should not update a cron - does not exist', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .put(`/api/crons/${objectId()}`)
            .send({ cron: '0 * * * * *', })

            // restore stubs
            cronStub.restore()
            res.status.should.equal(400)
        })

        it('should not update a cron - invalid cron', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeCron()),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .put(`/api/crons/${objectId()}`)
            .send({ cron: 'foobar', })

            // restore stubs
            cronStub.restore()
            res.status.should.equal(500)
        })

    })

    /* ============================
     * DELETE A CRON
     * ============================
     */
    describe('Delete a cron', function() {

        it('should delete a cron', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeCron()),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .delete(`/api/crons/${objectId()}`)

            // restore stubs
            cronStub.restore()

            res.status.should.equal(200)
        })

        it('should not delete a cron - does not exist', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .delete(`/api/crons/${objectId()}`)

            // restore stubs
            cronStub.restore()
            res.status.should.equal(400)
        })

        it('should not delete a cron - db error', async () => {

            // create stubs
            let cronStub = sinon.stub(Cron, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const app = expressApp([crons])
            const res = await request(app)
            .delete(`/api/crons/${objectId()}`)

            // restore stubs
            cronStub.restore()
            res.status.should.equal(500)
        })

    })

})
