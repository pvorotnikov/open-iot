const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { cleanDb, expressApp } = require('./_utils')

const { utils } = require('../src/lib')
const { User, ACCESS_LEVEL } = require('../src/models')
const passport = require('../src/passport')

describe('Passport', function() {

    let app

    before(done => {
        // create app
        app = expressApp([passport])

        cleanDb()
        .then(() => {
            return Promise.all([
                // create admin user
                new User({
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@admin.com',
                    password: utils.generatePassword('test'),
                    accessLevel: ACCESS_LEVEL.ADMIN,
                }).save(),
                // create regular user
                new User({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@test.com',
                    password: utils.generatePassword('test'),
                }).save()
            ])
        })
        .then(res => {
            done()
        })
    })

    after(done => {
        cleanDb()
        .then(res => done())
    })

    /* ============================
     * AUTHENTICATION SUITE
     * ============================
     */

    describe('Authentication', function() {

        it('should not authenticate user - wrong password', done => {
            request(app)
            .post('/api/passport/auth')
            .send({ email: 'admin@admin.com', password: 'wrong' })
            .expect(403, done)
        })

        it('should not authenticate user - wrong email', done => {
            request(app)
            .post('/api/passport/auth')
            .send({ email: 'wrong@wrong.com', password: 'wrong' })
            .expect(401, done)
        })

        it('should not authenticate user - db error', done => {

            const userFindStub = sinon.stub(User, 'findOne').rejects(new Error('user-rejection'))

            request(app)
            .post('/api/passport/auth')
            .send({ email: 'wrong@wrong.com', password: 'wrong' })
            .expect(500)
            .end((err, res) => {
                userFindStub.restore()
                res.body.errorMessage.should.equal('user-rejection')
                if (err) return done(err)
                done()
            })
        })

        it('should authenticate admin user', done => {
            request(app)
            .post('/api/passport/auth')
            .send({ email: 'admin@admin.com', password: 'test' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.should.have.all.keys('firstName', 'lastName', 'accessLevel', 'id', 'accessToken', 'refreshToken')
                res.body.data.firstName.should.equal('Admin')
                res.body.data.lastName.should.equal('User')
                res.body.data.accessLevel.should.equal(ACCESS_LEVEL.ADMIN)
                res.body.data.id.should.be.a('string')
                res.body.data.accessToken.should.be.a('string')
                res.body.data.refreshToken.should.be.a('string')
                done()
            })
        })

        it('should authenticate regular user', done => {
            request(app)
            .post('/api/passport/auth')
            .send({ email: 'test@test.com', password: 'test' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.should.have.all.keys('firstName', 'lastName', 'accessLevel', 'id', 'accessToken', 'refreshToken')
                res.body.data.firstName.should.equal('Test')
                res.body.data.lastName.should.equal('User')
                res.body.data.accessLevel.should.equal(ACCESS_LEVEL.USER)
                res.body.data.id.should.be.a('string')
                res.body.data.accessToken.should.be.a('string')
                res.body.data.refreshToken.should.be.a('string')
                done()
            })
        })

        it('should refresh token', done => {
            request(app)
            .post('/api/passport/auth')
            .send({ email: 'test@test.com', password: 'test' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                request(app)
                .get('/api/passport/refresh')
                .set('Authorization', `Bearer ${res.body.data.refreshToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err)
                    res.body.status.should.equal('ok')
                    res.body.data.should.have.all.keys('accessToken', 'refreshToken')
                    done()
                })
            })
        })

    })

    /* ============================
     * REGISTRATION SUITE
     * ============================
     */

    describe('Registration', function() {

        before(() => {
            nconf.set('global.enableregistrations', true)
        })

        after(() => {
            nconf.set('global.enableregistrations', false)
        })

        it('should not register user - disabled registrations', done => {
            nconf.set('global.enableregistrations', false)
            request(app)
            .post('/api/passport/register')
            .send({ email: 'test@test.com', password: 'goodPassword', firstName: 'New', lastName: 'User' })
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                nconf.set('global.enableregistrations', true)
                done()
            })
        })

        it('should not register user - wrong email', done => {
            request(app)
            .post('/api/passport/register')
            .send({ email: 'wrong', password: 'short', firstName: 'New', lastName: 'User' })
            .expect(400, done)
        })

        it('should not register user - short pass', done => {
            request(app)
            .post('/api/passport/register')
            .send({ email: 'user@user.com', password: 'short', firstName: 'New', lastName: 'User' })
            .expect(400, done)
        })

        it('should not register user - no first name', done => {
            request(app)
            .post('/api/passport/register')
            .send({ email: 'user@user.com', password: 'goodPassword', firstName: '', lastName: 'User' })
            .expect(400, done)
        })

        it('should not register user - no last name', done => {
            request(app)
            .post('/api/passport/register')
            .send({ email: 'user@user.com', password: 'goodPassword', firstName: 'New', lastName: '' })
            .expect(400, done)
        })

        it('should not register user - existing user', done => {
            request(app)
            .post('/api/passport/register')
            .send({ email: 'test@test.com', password: 'goodPassword', firstName: 'New', lastName: 'User' })
            .expect(400, done)
        })

        it('should not register user - db error', done => {
            const userSaveStub = sinon.stub(User.prototype, 'save').rejects(new Error('user-save'))

            request(app)
            .post('/api/passport/register')
            .send({ email: 'test@test.com', password: 'goodPassword', firstName: 'New', lastName: 'User' })
            .expect(500)
            .end((err, res) => {
                userSaveStub.restore()
                res.body.errorMessage.should.equal('user-save')
                if (err) return done(err)
                done()
            })
        })

        it('should register user', done => {
            request(app)
            .post('/api/passport/register')
            .send({ email: 'user@user.com', password: 'goodPassword', firstName: 'New', lastName: 'User' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                res.body.status.should.equal('ok')
                res.body.data.should.have.all.keys('firstName', 'lastName', 'accessLevel', 'id')
                res.body.data.firstName.should.equal('New')
                res.body.data.lastName.should.equal('User')
                res.body.data.accessLevel.should.equal(ACCESS_LEVEL.USER)
                res.body.data.id.should.be.a('string')
                done()
            })
        })

    })

})
