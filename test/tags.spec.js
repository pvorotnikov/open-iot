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

const { cleanDb, expressApp, objectId, protectMock, } = require('./_utils')

const { utils } = require('../src/lib')
const { Tag } = require('../src/models')
const auth = require('../src/lib/auth')
const tags = require('../src/tags')


describe('Tags', function() {

    function fakeTag(tag={}) {
        return new Tag({ name: 'tag', constraint: 'no', ...tag, })
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
     * GET TAGS
     * ============================
     */

    describe('Get tags', function() {

        it('should get all tags', async () => {

            // create stubs
            let tagStub = sinon.stub(Tag, 'find').resolves([fakeTag()])

            const app = expressApp([tags])
            const res = await request(app)
            .get('/api/tags')

            // restore stubs
            tagStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('array')
            res.body.data.length.should.equal(1)
        })

        it('should not get all tags - db error', async () => {

            // create stubs
            let tagStub = sinon.stub(Tag, 'find').rejects(new Error('DB Error'))

            const app = expressApp([tags])
            const res = await request(app)
            .get('/api/tags')

            // restore stubs
            tagStub.restore()

            res.status.should.equal(500)
        })

    })

    /* ============================
     * CREATE A TAG
     * ============================
     */

    describe('Create a tag', function() {

        it('should create a tag', async () => {

            const tagStub = sinon.stub(Tag.prototype, 'save').resolves()

            const app = expressApp([tags])
            const res = await request(app)
            .post('/api/tags')
            .send({ name: 'test', constraint: 'application' })

            tagStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.name.should.equal('test')
            res.body.data.constraint.should.equal('application')
        })

        it('should not create a tag - missing name', async () => {

            const tagStub = sinon.stub(Tag.prototype, 'save').resolves()

            const app = expressApp([tags])
            const res = await request(app)
            .post('/api/tags')
            .send({constraint: 'application' })

            tagStub.restore()

            res.status.should.equal(400)
        })

        it('should not create a tag - missing constraint', async () => {

            const tagStub = sinon.stub(Tag.prototype, 'save').resolves()

            const app = expressApp([tags])
            const res = await request(app)
            .post('/api/tags')
            .send({ name: 'test' })

            tagStub.restore()

            res.status.should.equal(400)
        })

        it('should not create a tag - db error', async () => {

            const tagStub = sinon.stub(Tag.prototype, 'save').rejects(new Error('DB Error'))

            const app = expressApp([tags])
            const res = await request(app)
            .post('/api/tags')
            .send({ name: 'test', constraint: 'application' })

            tagStub.restore()

            res.status.should.equal(500)
        })

    })

    /* ============================
     * UPDATE A TAG
     * ============================
     */

    describe('Update a tag', function() {

        it('should update a tag', async () => {

            // create stubs
            let tagStub = sinon.stub(Tag, 'findByIdAndUpdate').resolves(fakeTag({
                name: 'newtest',
                constraint: 'global'
            }))

            const app = expressApp([tags])
            const res = await request(app)
            .put('/api/tags/' + objectId().toString())
            .send({ name: 'newtest', constraint: 'global' })

            // restore stubs
            tagStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.name.should.equal('newtest')
            res.body.data.constraint.should.equal('global')
        })

        it('should update a tag - no change', async () => {

            // create stubs
            let tagStub = sinon.stub(Tag, 'findByIdAndUpdate').resolves(fakeTag())

            const app = expressApp([tags])
            const res = await request(app)
            .put('/api/tags/' + objectId().toString())
            .send({})

            // restore stubs
            tagStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.name.should.equal('tag')
            res.body.data.constraint.should.equal('no')
        })

        it('should not update a tag - does not exist', async () => {

            // create stubs
            let tagStub = sinon.stub(Tag, 'findByIdAndUpdate').resolves(null)

            const app = expressApp([tags])
            const res = await request(app)
            .put('/api/tags/' + objectId().toString())
            .send({ name: 'newtest', constraint: 'global' })

            // restore stubs
            tagStub.restore()

            res.status.should.equal(400)
        })

        it('should not update a tag - db error', async () => {

            // create stubs
            let tagStub = sinon.stub(Tag, 'findByIdAndUpdate').rejects(new Error('DB Error'))

            const app = expressApp([tags])
            const res = await request(app)
            .put('/api/tags/' + objectId().toString())
            .send({ name: 'newtest', constraint: 'global' })

            // restore stubs
            tagStub.restore()

            res.status.should.equal(500)
        })

    })

    /* ============================
     * REMOVE A TAG
     * ============================
     */

    describe('Remove a tag', function() {

        it('should remove a tag', async () => {
            // create stubs
            let tagStub = sinon.stub(Tag, 'findById').resolves(fakeTag())

            const app = expressApp([tags])
            const res = await request(app)
            .delete('/api/tags/' + objectId().toString())

            // restore stubs
            tagStub.restore()

            res.status.should.equal(200)
        })

        it('should not remove a tag - does not exist', async () => {
            // create stubs
            let tagStub = sinon.stub(Tag, 'findById').resolves(null)

            const app = expressApp([tags])
            const res = await request(app)
            .delete('/api/tags/' + objectId().toString())

            // restore stubs
            tagStub.restore()

            res.status.should.equal(400)
        })

        it('should not remove a tag - db error', async () => {
            // create stubs
            let tagStub = sinon.stub(Tag, 'findById').rejects(new Error('DB Error'))

            const app = expressApp([tags])
            const res = await request(app)
            .delete('/api/tags/' + objectId().toString())

            // restore stubs
            tagStub.restore()

            res.status.should.equal(500)
        })

    })

})
