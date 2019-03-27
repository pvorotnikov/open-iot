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
const { User, ACCESS_LEVEL } = require('../src/models')
const users = require('../src/users')

describe('Users', function() {

    let app
    let userAuthorization, managerAuthorization
    let currentUser, currentManager

    function createUser() {
        return new Promise((fulfill, reject) => {
            new User({
                firstName: 'Test',
                lastName: 'User',
                email: 'test',
                password: utils.generatePassword('test'),
            }).save()
            .then(user => {
                userAuthorization = 'Basic ' + Buffer.from(user.key + ':' + user.secret).toString('base64')
                currentUser = user
                fulfill(user)
            })
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
                managerAuthorization = 'Basic ' + Buffer.from(user.key + ':' + user.secret).toString('base64')
                currentManager = user
                fulfill(user)
            })
            .catch(err => reject(err))
        })
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

        before(done => {
            Promise.all([ cleanDb(), createUser(), createManager() ])
            .then(res => done())
        })

        it('should fetch all users', done => {
            request(app)
            .get('/api/users')
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
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
                done()
            })
        })

        it('should not fetch all users - insufficient credentials', done => {
            request(app)
            .get('/api/users')
            .set('Authorization', userAuthorization)
            .expect(403, done)
        })

        it('should not fetch all users - db error', done => {
            const userStub = sinon.stub(User, 'find').rejects(new Error('user-find'))
            request(app)
            .get('/api/users')
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                userStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })

    /* ============================
     * USER UPDATE
     * ============================
     */

    describe('User update', function() {

        before(done => {
            Promise.all([ cleanDb(), createUser(), createManager() ])
            .then(res => done())
        })

        it('should update user', done => {
            request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', email: 'update@user.com' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.should.be.an('object')
                User.findById(currentUser._id)
                .then(user => {
                    user.firstName.should.equal('Updated')
                    user.lastName.should.equal('User')
                    user.email.should.equal('update@user.com')
                })
                .finally(() => done())
            })
        })

        it('should update user passord', done => {
            request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated2', lastName: 'User2', email: 'update2@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.should.be.an('object')
                User.findById(currentUser._id)
                .then(user => {
                    user.firstName.should.equal('Updated2')
                    user.lastName.should.equal('User2')
                    user.email.should.equal('update2@user.com')
                })
                .finally(() => done())
            })
        })

        it('should not update user - no first name', done => {
            request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ lastName: 'User', email: 'update@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)
            .expect(400, done)
        })

        it('should not update user - no last name', done => {
            request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', email: 'update@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)
            .expect(400, done)
        })

        it('should not update user - no email', done => {
            request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', password: '123456' })
            .set('Authorization', managerAuthorization)
            .expect(400, done)
        })

        it('should not update user - short password', done => {
            request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', email: 'update@user.com', password: '12345' })
            .set('Authorization', managerAuthorization)
            .expect(400, done)
        })

        it('should not update user - db error', done => {
            const userStub = sinon.stub(User, 'findByIdAndUpdate').rejects(new Error('user-find'))
            request(app)
            .put(`/api/users/${currentUser._id}`)
            .send({ firstName: 'Updated', lastName: 'User', email: 'update@user.com', password: '123456' })
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                userStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })

    /* ============================
     * USER DELETE
     * ============================
     */

    describe('User delete', function() {

        before(done => {
            Promise.all([ cleanDb(), createUser(), createManager() ])
            .then(res => done())
        })

        it('should delete user', done => {
            request(app)
            .delete(`/api/users/${currentUser._id}`)
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.should.be.an('object')
                done()
            })
        })

        it('should not delete user - does not exist', done => {
            request(app)
            .delete(`/api/users/dummy`)
            .set('Authorization', managerAuthorization)
            .expect(500, done)
        })

        it('should not delete user - insufficient credentials', done => {
            request(app)
            .delete(`/api/users/${currentUser._id}`)
            .set('Authorization', userAuthorization)
            .expect(403, done)
        })

        it('should not delete user - self', done => {
            request(app)
            .delete(`/api/users/${currentManager._id}`)
            .set('Authorization', managerAuthorization)
            .expect(400, done)
        })

        it('should not delete user - db error', done => {
            const userStub = sinon.stub(User, 'findById').rejects(new Error('user-find'))
            request(app)
            .delete(`/api/users/${currentUser._id}`)
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                userStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })

    /* ============================
     * UPDATE USER KEY
     * ============================
     */

    describe('User key', function() {

        before(done => {
            Promise.all([ cleanDb(), createUser(), createManager() ])
            .then(res => done())
        })

        it('should update user key', done => {
            request(app)
            .put(`/api/users/${currentUser._id}/key`)
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.key.should.be.a('string')
                done()
            })
        })

        it('should not update user key user - insufficient credentials', done => {
            request(app)
            .put(`/api/users/${currentUser._id}/key`)
            .set('Authorization', userAuthorization)
            .expect(403, done)
        })

        it('should not update user key user - does not exist', done => {
            request(app)
            .put(`/api/users/dummy/key`)
            .set('Authorization', managerAuthorization)
            .expect(500, done)
        })

        it('should not update user key - db error', done => {
            const userStub = sinon.stub(User, 'findByIdAndUpdate').rejects(new Error('user-find'))
            request(app)
            .put(`/api/users/${currentUser._id}/key`)
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                userStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })

    /* ============================
     * UPDATE USER SECRET
     * ============================
     */

    describe('User secret', function() {

        before(done => {
            Promise.all([ cleanDb(), createUser(), createManager() ])
            .then(res => done())
        })

        it('should update user secret', done => {
            request(app)
            .put(`/api/users/${currentUser._id}/secret`)
            .set('Authorization', managerAuthorization)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.secret.should.be.a('string')
                done()
            })
        })

        it('should not update user secret user - insufficient credentials', done => {
            request(app)
            .put(`/api/users/${currentUser._id}/secret`)
            .set('Authorization', userAuthorization)
            .expect(403, done)
        })

        it('should not update user secret user - does not exist', done => {
            request(app)
            .put(`/api/users/dummy/secret`)
            .set('Authorization', managerAuthorization)
            .expect(500, done)
        })

        it('should not update user secret - db error', done => {
            const userStub = sinon.stub(User, 'findByIdAndUpdate').rejects(new Error('user-find'))
            request(app)
            .put(`/api/users/${currentUser._id}/secret`)
            .set('Authorization', managerAuthorization)
            .expect(500)
            .end((err, res) => {
                userStub.restore()
                if (err) return done(err)
                done()
            })
        })

    })

})
