const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { cleanDb, logger, objectId } = require('../_utils')

const { utils } = require('../../src/lib')
const { Application, Gateway, Rule, User, Token, ACCESS_LEVEL } = require('../../src/models')
const auth = rewire('../../src/lib/auth')

describe('Authentication', function() {

    let user

    const verifyToken = auth.__get__('verifyToken')
    const storeTokens = auth.__get__('storeTokens')
    const createToken = auth.__get__('createToken')

    before(done => {
        cleanDb()
        .then(() => {
            return Promise.all([
                new User({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@test.com',
                    password: utils.generatePassword('test'),
                }).save()
            ])
        })
        .then(res => {
            user = res[0]
            done()
        })
    })

    after(done => {
        cleanDb()
        .then(res => done())
    })

    afterEach(() => {
        auth.__set__('storeTokens', storeTokens)
        auth.__set__('createToken', createToken)
        auth.__set__('verifyToken', verifyToken)
    })

    /* ============================
     * CREATE SUITE
     * ============================
     */

    describe('Create', function() {

        it('should create tokens', () => {

            const storeTokensSpy = sinon.spy(storeTokens)
            auth.__set__('storeTokens', storeTokensSpy)

            const createTokenSpy = sinon.spy(createToken)
            auth.__set__('createToken', createTokenSpy)

            let tokens = auth.createTokens(user)
            tokens.should.be.an('object')
            tokens.accessToken.should.be.a('string')
            tokens.refreshToken.should.be.a('string')
            createTokenSpy.should.have.been.calledWith(sinon.match.has('key')
                .and(sinon.match.has('type'))
                .and(sinon.match.has('accessLevel', user.accessLevel))
                .and(sinon.match.has('id', user._id))
            )
            storeTokensSpy.should.have.been.calledWith(sinon.match((value) => value._id === user._id), sinon.match.string, sinon.match.string)
        })

        it('should not create tokens - db error', done => {

            const storeTokensStub = sinon.stub().rejects(new Error('Forced reject'))
            auth.__set__('storeTokens', storeTokensStub)

            auth.createTokens(user)
            setImmediate(() => {
                done()
            })
        })

    })

    /* ============================
     * PROTECT SUITE
     * ============================
     */

    describe('Protect', function() {

        class Request {
            constructor(headers, body) {
                this.headers = headers || {}
                this.body = body || {}
                this.methoh = 'GET'
                this.originalUrl = '/test'
                this.user = null
            }
        }

        class Response {
            constructor(cb) {
                this._json = null
                this._status = 200
                this._cb = cb || null
            }

            status(s) {
                this._status = s
                if (this._cb) this._cb('status', this)
                return this
            }

            json(j) {
                this._json = j
                if (this._cb) this._cb('json', this)
                return this
            }
        }

        function next() { }

        it('protect: should reject - no header', () => {
            let protect = auth.protect()
            let req = new Request()
            let res = new Response()
            protect(req, res, next)
            res._status.should.equal(401)
            res._json.status.should.equal('error')
            res._json.errorMessage.should.equal('No authorization header')
        })

        it('protect: should reject - wrong schema', () => {
            let protect = auth.protect()
            let req = new Request({ authorization: 'Wrong ' })
            let res = new Response()
            protect(req, res, next)
            res._status.should.equal(401)
            res._json.status.should.equal('error')
            res._json.errorMessage.should.equal('Unsupported authorization schema')
        })

        /* ============================
         * PROTECT: BEARER
         * ============================
         */

        it('protect: should reject - invalid bearer', done => {

            const verifyTokenSpy = sinon.spy(verifyToken)
            auth.__set__('verifyToken', verifyTokenSpy)

            let protect = auth.protect()
            let req = new Request({ authorization: 'Bearer wrong' })
            let res = new Response((method, res) => {
                if ('json' === method) {
                    try {
                        res._status.should.equal(403)
                        res._json.status.should.equal('error')
                        res._json.errorMessage.should.equal('Invalid token')
                        done()
                    } catch (err) {
                        done(err)
                    }
                }
            })
            protect(req, res, next)
            verifyTokenSpy.should.have.been.calledWith('wrong')
        })

        it('protect: should reject - token does not exist', done => {

            const token = createToken({ 'test': 123 })
            const verifyTokenSpy = sinon.spy(verifyToken)
            auth.__set__('verifyToken', verifyTokenSpy)

            const protect = auth.protect()
            const req = new Request({ authorization: 'Bearer ' + token })
            const res = new Response((method, res) => {
                if ('json' === method) {
                    try {
                        res._status.should.equal(403)
                        res._json.status.should.equal('error')
                        res._json.errorMessage.should.equal('Token does not exist')
                        done()
                    } catch (err) {
                        done(err)
                    }
                }
            })
            protect(req, res, next)
            verifyTokenSpy.should.have.been.calledWith(token)
        })

        it('protect: should reject - insufficient token access level', done => {
            let accessToken = createToken({ key: 'access-key', type: 'access', accessLevel: user.accessLevel, id: user._id, })
            let refreshToken = createToken({ key: 'refresh-key', type: 'refresh', accessLevel: user.accessLevel, id: user._id, })
            Promise.all([
                new Token({ user: user._id, type: 'access', value: 'access-key', }).save(),
                new Token({ user: user._id, type: 'refresh', value: 'refresh-key', }).save()
            ])
            .then(() => {
                const protect = auth.protect(ACCESS_LEVEL.ADMIN)
                const req = new Request({ authorization: 'Bearer ' + accessToken })
                const res = new Response((method, res) => {
                    if ('json' === method) {
                        try {
                            res._status.should.equal(403)
                            res._json.status.should.equal('error')
                            res._json.errorMessage.should.equal('Insufficient access level')
                            done()
                        } catch (err) {
                            done(err)
                        }
                    }
                })
                protect(req, res, next)
            })
        })

        it('protect: should allow - valid token', done => {
            let accessToken = createToken({ key: 'access-key', type: 'access', accessLevel: user.accessLevel, id: user._id, })
            let refreshToken = createToken({ key: 'refresh-key', type: 'refresh', accessLevel: user.accessLevel, id: user._id, })
            Promise.all([
                new Token({ user: user._id, type: 'access', value: 'access-key', }).save(),
                new Token({ user: user._id, type: 'refresh', value: 'refresh-key', }).save()
            ])
            .then(() => {
                const protect = auth.protect()
                const req = new Request({ authorization: 'Bearer ' + accessToken })
                const res = new Response()
                protect(req, res, function() {
                    try {
                        req.user.should.not.be.null
                        req.user.should.be.an('object')
                        expect(req.user._id.toString()).to.equal(user._id.toString())
                        done()
                    } catch (err) {
                        done(err)
                    }
                })
            })
        })


        /* ============================
         * PROTECT: BASIC
         * ============================
         */

        it('protect: should reject - improper credentials', done => {
            const credentials = new Buffer('wrong:wronger').toString('base64')
            const protect = auth.protect()
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response((method, res) => {
                if ('json' === method) {
                    try {
                        res._status.should.equal(403)
                        res._json.status.should.equal('error')
                        res._json.errorMessage.should.equal('Credentials do not exist')
                        done()
                    } catch (err) {
                        done(err)
                    }
                }
            })
            protect(req, res, next)
        })

        it('protect: should reject - improper secret', done => {
            const credentials = new Buffer(`${user.key}:wronger`).toString('base64')
            const protect = auth.protect()
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response((method, res) => {
                if ('json' === method) {
                    try {
                        res._status.should.equal(403)
                        res._json.status.should.equal('error')
                        res._json.errorMessage.should.equal('Credentials do not exist')
                        done()
                    } catch (err) {
                        done(err)
                    }
                }
            })
            protect(req, res, next)
        })

        it('protect: should reject - improper key', done => {
            const credentials = new Buffer(`wrong:${user.secret}`).toString('base64')
            const protect = auth.protect()
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response((method, res) => {
                if ('json' === method) {
                    try {
                        res._status.should.equal(403)
                        res._json.status.should.equal('error')
                        res._json.errorMessage.should.equal('Credentials do not exist')
                        done()
                    } catch (err) {
                        done(err)
                    }
                }
            })
            protect(req, res, next)
        })

        it('protect: should reject - insufficient credentials access level', done => {
            const credentials = new Buffer(`${user.key}:${user.secret}`).toString('base64')
            const protect = auth.protect(ACCESS_LEVEL.ADMIN)
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response((method, res) => {
                if ('json' === method) {
                    try {
                        res._status.should.equal(403)
                        res._json.status.should.equal('error')
                        res._json.errorMessage.should.equal('Insufficient access level')
                        done()
                    } catch (err) {
                        done(err)
                    }
                }
            })
            protect(req, res, next)
        })

        it('protect: should reject - db error', done => {
            const userFindStub = sinon.stub(User, 'findOne').rejects(new Error('user-rejection'))

            const credentials = new Buffer(`${user.key}:${user.secret}`).toString('base64')
            const protect = auth.protect()
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response((method, res) => {
                userFindStub.restore()
                if ('json' === method) {
                    try {
                        res._status.should.equal(403)
                        res._json.status.should.equal('error')
                        res._json.errorMessage.should.equal('Invalid credentials')
                        done()
                    } catch (err) {
                        done(err)
                    }
                }
            })
            protect(req, res, next)
        })

        it('protect: should allow - valid credentials', done => {
            const credentials = new Buffer(`${user.key}:${user.secret}`).toString('base64')
            const protect = auth.protect()
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response()
            protect(req, res, function() {
                try {
                    req.user.should.not.be.null
                    req.user.should.be.an('object')
                    expect(req.user._id.toString()).to.equal(user._id.toString())
                    done()
                } catch (err) {
                    done(err)
                }
            })
        })

        /* ============================
         * BASIC
         * ============================
         */

        it('basic: should reject - no header', () => {
            let basic = auth.basic()
            let req = new Request()
            let res = new Response()
            basic(req, res, next)
            res._status.should.equal(401)
            res._json.status.should.equal('error')
            res._json.errorMessage.should.equal('No authorization header')
        })

        it('basic: should reject - wrong schema', () => {
            let basic = auth.basic()
            let req = new Request({ authorization: 'Wrong ' })
            let res = new Response()
            basic(req, res, next)
            res._status.should.equal(401)
            res._json.status.should.equal('error')
            res._json.errorMessage.should.equal('Unsupported authorization schema')
        })

        it('basic: should reject - invalid credentials', () => {
            const credentials = new Buffer(`${user.key}:${user.secret}`).toString('base64')
            const basic = auth.basic()
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response()
            basic(req, res, () => { throw new Error() })
            res._status.should.equal(403)
            res._json.status.should.equal('error')
            res._json.errorMessage.should.equal('Invalid credentials')
        })

        it('basic: should allow - valid credentials', done => {
            const credentials = new Buffer(`${user.key}:${user.secret}`).toString('base64')
            const basic = auth.basic()
            const req = new Request({ authorization: 'Basic ' + credentials })
            const res = new Response()
            basic(req, res, function() {
                try {
                    req.user.should.not.be.null
                    req.user.should.be.an('object')
                    req.user.username.should.equal(user.key)
                    req.user.password.should.equal(user.secret)
                    done()
                } catch (err) {
                    done(err)
                }
            })
        })

    })

})
