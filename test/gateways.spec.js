const _ = require('lodash')
const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const moment = require('moment')
const rewire = require('rewire')

const { cleanDb, expressApp, objectId, } = require('./_utils')

const { utils } = require('../src/lib')
const { User, Gateway, Application, Tag, ACCESS_LEVEL } = require('../src/models')
const gateways = rewire('../src/gateways')

describe('Gateways', function() {

    const app = expressApp([gateways])
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

    function fakeGateway(gw={}) {
        return {
            id: objectId(),
            name: 'gwname',
            description: 'gwdescription',
            alias: 'gwalias',
            tags: {},
            created: moment().toISOString(),
            updated: moment().toISOString(),
            application: {
                id: objectId(),
                name: 'appname',
                alias: 'appalias',
                created: moment().toISOString(),
                updated: moment().toISOString(),
            },
            remove: sinon.stub().resolves(),
            ...gw,
        }
    }

    function fakeTag(tag={}) {
        return {
            id: objectId(),
            name: 'tag',
            constrained: 'no',
            created: moment().toISOString(),
            updated: moment().toISOString(),
            ...tag,
        }
    }

    before(async () => {
        await cleanDb()
        await createUsers()
    })

    after(async () => {
        await cleanDb()
    })

    /* ============================
     * GET GATEWAYS
     * ============================
     */

    describe('Get gateways', function() {

        it('should get all gateways', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().returnsThis(),
                populate: sinon.stub().resolves([fakeGateway()]),
            })

            const res = await request(app)
            .get('/api/gateways')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('array')
            res.body.data.length.should.equal(1)
        })

        it('should not all gateways - db error', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().returnsThis(),
                populate: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .get('/api/gateways')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
        })

    })

    /* ============================
     * GET A GATEWAY
     * ============================
     */

    describe('Get a gateway', function() {

        it('should get a gateway', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeGateway({id: 'gwid'})),
            })

            const res = await request(app)
            .get('/api/gateways/123')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.id.should.equal('gwid')
        })

        it('should not get a gateway - does not exist', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const res = await request(app)
            .get('/api/gateways/123')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(400)
        })

        it('should not get a gateway - DB Error', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .get('/api/gateways/123')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
        })

    })

    /* ============================
     * CREATE A GATEWAY
     * ============================
     */

    describe('Create a gateway', function() {

        it('should create a gateway', async () => {

            // create stubs
            let applicationStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves({_id: objectId() }),
            })

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({
                application: objectId(),
                name: 'gateway',
                description: 'gateway',
                tags: { tag: 'value' },
            })

            // restore stubs
            applicationStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
        })

        it('should create a gateway - no tags', async () => {

            // create stubs
            let applicationStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves({_id: objectId() }),
            })

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({ application: objectId(), name: 'gateway', description: 'gateway' })

            // restore stubs
            applicationStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
        })

        it('should create a gateway - application no constrained tag', async () => {

            // create stubs
            let applicationId = objectId().toString()
            let applicationStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves({_id: applicationId }),
            })
            let tagStub = sinon.stub(Tag, 'findOne').resolves(fakeTag({
                constraint: 'no'
            }))

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({
                application: applicationId,
                name: 'gateway',
                description: 'gateway',
                tags: { tag: 'value' },
            })

            // restore stubs
            tagStub.restore()
            applicationStub.restore()

            res.status.should.equal(200)
        })

        it('should not create a gateway - application constrained tag', async () => {

            // create stubs
            let applicationId = objectId().toString()
            let applicationStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves({_id: applicationId }),
            })
            let tagStub = sinon.stub(Tag, 'findOne').resolves(fakeTag({
                constraint: 'application'
            }))
            const gatewayMock = sinon.mock(Gateway)
            gatewayMock.expects('find')
            .chain('where').withArgs('application')
            .chain('eq').withArgs(applicationId)
            .chain('where').withArgs('tags.tag')
            .chain('eq').withArgs('value')
            .resolves([ fakeGateway() ])

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({
                application: applicationId,
                name: 'gateway',
                description: 'gateway',
                tags: { tag: 'value' },
            })

            // restore stubs
            gatewayMock.restore()
            tagStub.restore()
            applicationStub.restore()

            gatewayMock.verify()
            res.status.should.equal(400)
        })

        it('should not create a gateway - globally constrained tag', async () => {

            // create stubs
            let applicationId = objectId().toString()
            let applicationStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves({_id: applicationId }),
            })
            let tagStub = sinon.stub(Tag, 'findOne').resolves(fakeTag({
                constraint: 'global'
            }))
            const gatewayMock = sinon.mock(Gateway)
            gatewayMock.expects('find')
            .chain('where').withArgs('tags.tag')
            .chain('eq').withArgs('value')
            .resolves([ fakeGateway() ])

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({
                application: applicationId,
                name: 'gateway',
                description: 'gateway',
                tags: { tag: 'value' },
            })

            // restore stubs
            gatewayMock.restore()
            tagStub.restore()
            applicationStub.restore()

            gatewayMock.verify()
            res.status.should.equal(400)
        })

        it('should not create a gateway - DB error', async () => {

            // create stubs
            let applicationStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({ application: objectId(), name: 'gateway', description: 'gateway' })

            // restore stubs
            applicationStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
        })

        it('should not create a gateway - wrong application', async () => {

            // create stubs
            let applicationStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({ application: objectId(), name: 'gateway', description: 'gateway' })

            // restore stubs
            applicationStub.restore()

            res.status.should.equal(400)
        })

        it('should not create a gateway - empty application', async () => {

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({ application: '', name: 'gateway', description: 'gateway' })

            res.status.should.equal(400)
        })

        it('should  notcreate a gateway - empty name', async () => {

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({ application: objectId(), name: '', description: 'gateway' })

            res.status.should.equal(400)
        })

        it('should not create a gateway - empty description', async () => {

            const res = await request(app)
            .post('/api/gateways')
            .set('Authorization', userAuthorization)
            .send({ application: objectId(), name: 'gateway', description: '' })

            res.status.should.equal(400)
        })

    })

    /* ============================
     * UPDATE A GATEWAY
     * ============================
     */

    describe('Update a gateway', function() {

        it('should update a gateway', async () => {

            // create stubs
            let gw = fakeGateway()
            let gatewayUpdateStub = sinon.stub(Gateway, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(gw),
            })
            let gatewayFindStub = sinon.stub(Gateway, 'findById').resolves(gw)

            const res = await request(app)
            .put(`/api/gateways/${gw.id}`)
            .set('Authorization', userAuthorization)
            .send({
                name: 'gateway',
                description: 'gateway',
                alias: 'gateway',
                tags: { 'new-tag': 'new-value' },
            })

            // restore stubs
            gatewayUpdateStub.restore()
            gatewayFindStub.restore()

            res.status.should.equal(200)
        })

        it('should update a gateway - no change', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeGateway()),
            })

            const res = await request(app)
            .put('/api/gateways/123')
            .set('Authorization', userAuthorization)
            .send({})

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(200)
        })

        it('should not update a gateway - DB Error', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .put('/api/gateways/123')
            .set('Authorization', userAuthorization)
            .send({})

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
        })

    })

    /* ============================
     * REMOVE A GATEWAY
     * ============================
     */

    describe('Remove a gateway', function() {

        it('should remove a gateway', async () => {

            // create stubs
            const gw = fakeGateway()
            let gatewayStub = sinon.stub(Gateway, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(gw),
            })

            const res = await request(app)
            .delete('/api/gateways/123')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(200)
            gw.remove.should.have.been.called
        })

        it('should not remove a gateway - gateway not found', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const res = await request(app)
            .delete('/api/gateways/123')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(400)
            res.body.status.should.equal('error')
        })

        it('should not remove a gateway - DB Error', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .delete('/api/gateways/123')
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
        })

    })

})
