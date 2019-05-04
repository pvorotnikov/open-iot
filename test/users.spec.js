const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { cleanDb, expressApp, objectId } = require('./_utils')

const { utils } = require('../src/lib')
const { User, ACCESS_LEVEL } = require('../src/models')
const users = require('../src/users')

describe('Users', function() {

    let app
    let userAuthorization, managerAuthorization
    let currentUser, currentManager

    async function createUser() {
        const user = await new User({
            firstName: 'Test',
            lastName: 'User',
            email: 'test',
            password: utils.generatePassword('test'),
        }).save()
        userAuthorization = 'Basic ' + Buffer.from(user.key + ':' + user.secret).toString('base64')
        currentUser = user
        return user
    }

    async function createManager() {
        const user = await new User({
            firstName: 'Manager',
            lastName: 'User',
            email: 'manager',
            password: utils.generatePassword('test'),
            accessLevel: ACCESS_LEVEL.MANAGER,
        }).save()
        managerAuthorization = 'Basic ' + Buffer.from(user.key + ':' + user.secret).toString('base64')
        currentManager = user
        return user
    }

    before(() => {
        // create app
        app = expressApp([users])
    })

    /* ============================
     * USER LIST
     * ============================
     */

    describe('User list', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createUser(), createManager() ])
        })

        it('should fetch all users', async () => {
            const res = await request(app)
            .get('/api/users')
            .set('Authorization', managerAuthorization)

            res.status.should.equal(200)
            res.body.data.length.should.be.gt(0)
            res.body.data.forEach(u => {
                u.should.have.all.keys('email', 'firstName', 'lastName', 'accessLevel', 'id', 'key', 'secret')
                u.email.should.be.a('string')
                u.firstName.should.be.a('string')
                u.lastName.should.be.a('string')
                u.accessLevel.should.be.a('number')
                u.id.should.be.a('string')
                u.key.should.be.a('string')
                u.secret.should.be.a('string')
            })
        })

        it('should not fetch all users - insufficient credentials', async () => {
            const res = await request(app)
            .get('/api/users')
            .set('Authorization', userAuthorization)
            res.status.should.equal(403)
        })

        it('should not fetch all users - db error', async () => {
            const userStub = sinon.stub(User, 'find').rejects(new Error('user-find'))
            const res = await request(app)
            .get('/api/users')
            .set('Authorization', managerAuthorization)
            userStub.restore()
            res.status.should.equal(500)
        })

    })

    /* ============================
     * USER UPDATE
     * ============================
     */

    describe('User update', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createUser(), createManager() ])
        })

        it('should update user', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', email: 'update@user.com' })
            .set('Authorization', managerAuthorization)

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('object')

            const user = await User.findById(currentUser._id)
            user.firstName.should.equal('Updated')
            user.lastName.should.equal('User')
            user.email.should.equal('update@user.com')
        })

        it('should update user passord', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated2', lastName: 'User2', email: 'update2@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('object')

            const user = await User.findById(currentUser._id)
            user.firstName.should.equal('Updated2')
            user.lastName.should.equal('User2')
            user.email.should.equal('update2@user.com')
        })

        it('should not update user - does not exist', async () => {
            const res = await request(app)
            .put(`/api/users/${objectId()}`)
            .send({ firstName: 'Updated', lastName: 'User', email: 'update@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)
            res.status.should.equal(400)
        })

        it('should update user - no first name', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ lastName: 'User', email: 'update@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)
            res.status.should.equal(200)
        })

        it('should update user - no last name', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', email: 'update@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)
            res.status.should.equal(200)
        })

        it('should update user - no email', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', password: '123456' })
            .set('Authorization', managerAuthorization)
            res.status.should.equal(200)
        })

        it('should not update user - short password', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', email: 'update@user.com', password: '12345' })
            .set('Authorization', managerAuthorization)
            res.status.should.equal(400)
        })

        it('should not update user - db error', async () => {
            const userStub = sinon.stub(User, 'findByIdAndUpdate').rejects(new Error('user-find'))
            const res = await request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', email: 'update@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)

            userStub.restore()
            res.status.should.equal(500)
        })

    })

    /* ============================
     * USER DELETE
     * ============================
     */

    describe('User delete', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createUser(), createManager() ])
        })

        it('should delete user', async () => {
            const res = await request(app)
            .delete(`/api/users/${currentUser._id}`)
            .set('Authorization', managerAuthorization)

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.should.be.an('object')
        })

        it('should not delete user - does not exist', async () => {
            const res = await request(app)
            .delete(`/api/users/${objectId()}`)
            .set('Authorization', managerAuthorization)
            res.status.should.equal(400)
        })

        it('should not delete user - insufficient credentials', async () => {
            const res = await request(app)
            .delete(`/api/users/${currentUser._id}`)
            .set('Authorization', userAuthorization)
            res.status.should.equal(403)
        })

        it('should not delete user - self', async () => {
            const res = await request(app)
            .delete(`/api/users/${currentManager._id}`)
            .set('Authorization', managerAuthorization)
            res.status.should.equal(400)
        })

        it('should not delete user - db error', async () => {
            const userStub = sinon.stub(User, 'findById').rejects(new Error('user-find'))
            const res = await request(app)
            .delete(`/api/users/${currentUser._id}`)
            .set('Authorization', managerAuthorization)
            userStub.restore()
            res.status.should.equal(500)
        })

    })

    /* ============================
     * UPDATE USER KEY
     * ============================
     */

    describe('User key', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createUser(), createManager() ])
        })

        it('should update user key', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}/key`)
            .set('Authorization', managerAuthorization)

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.key.should.be.a('string')
        })

        it('should not update user key user - insufficient credentials', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}/key`)
            .set('Authorization', userAuthorization)
            res.status.should.equal(403)
        })

        it('should not update user key user - does not exist', async () => {
            const res = await request(app)
            .put(`/api/users/${objectId()}/key`)
            .set('Authorization', managerAuthorization)
            res.status.should.equal(200)
        })

        it('should not update user key - db error', async () => {
            const userStub = sinon.stub(User, 'findByIdAndUpdate').rejects(new Error('user-find'))
            const res = await request(app)
            .put(`/api/users/${currentUser._id}/key`)
            .set('Authorization', managerAuthorization)

            userStub.restore()
            res.status.should.equal(500)
        })

    })

    /* ============================
     * UPDATE USER SECRET
     * ============================
     */

    describe('User secret', function() {

        before(async () => {
            await Promise.all([ cleanDb(), createUser(), createManager() ])
        })

        it('should update user secret', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}/secret`)
            .set('Authorization', managerAuthorization)

            res.status.should.equal(200)
            res.body.status.should.equal('ok')
            res.body.data.secret.should.be.a('string')
        })

        it('should not update user secret user - insufficient credentials', async () => {
            const res = await request(app)
            .put(`/api/users/${currentUser._id}/secret`)
            .set('Authorization', userAuthorization)
            res.status.should.equal(403)
        })

        it('should not update user secret user - does not exist', async () => {
            const res = await request(app)
            .put(`/api/users/${objectId()}/secret`)
            .set('Authorization', managerAuthorization)
            res.status.should.equal(200)
        })

        it('should not update user secret - db error', async () => {
            const userStub = sinon.stub(User, 'findByIdAndUpdate').rejects(new Error('user-find'))
            const res = await request(app)
            .put(`/api/users/${currentUser._id}/secret`)
            .set('Authorization', managerAuthorization)

            userStub.restore()
            res.status.should.equal(500)
        })

    })

})
