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
const { Application, Gateway, Rule, User, Token } = require('../../src/models')
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
            logger.info(JSON.stringify(user))
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

        it('should create token', () => {

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
                this.user = null
            }
        }

        class Response {
            constructor() {
                this._json = null
                this._status = 200
            }

            status(s) {
                this._status = s
                return this
            }

            json(j) {
                this._json = j
                return this
            }
        }

        function next() { }

        it('should reject - no header', () => {
            let protect = auth.protect()
            let req = new Request()
            let res = new Response()
            protect(req, res, next)
            res._status.should.equal(401)
        })

        it('should reject - wrong schema', () => {
            let protect = auth.protect()
            let req = new Request({ authorization: 'Wrong ' })
            let res = new Response()
            protect(req, res, next)
            res._status.should.equal(401)
        })

        it('should reject - invalid bearer', () => {

            const verifyTokenSpy = sinon.spy(verifyToken)
            auth.__set__('verifyToken', verifyTokenSpy)

            let protect = auth.protect()
            let req = new Request({ authorization: 'Bearer wrong' })
            let res = new Response()
            protect(req, res, next)
            verifyTokenSpy.should.have.been.calledWith('wrong')
            // TODO: check res._status
        })

        it('should reject - token does not exist', () => {

            const token = createToken({ 'test': 123 })
            const verifyTokenSpy = sinon.spy(verifyToken)
            auth.__set__('verifyToken', verifyTokenSpy)

            const protect = auth.protect()
            const req = new Request({ authorization: 'Bearer ' + token })
            const res = new Response()
            protect(req, res, next)
            verifyTokenSpy.should.have.been.calledWith(token)
            // TODO: check res._status
        })

        it('should allow', done => {


            let accessToken = createToken({ key: 'access-key', type: 'access', accessLevel: user.accessLevel, id: user._id, })
            let refreshToken = createToken({ key: 'refresh-key', type: 'refresh', accessLevel: user.accessLevel, id: user._id, })
            Promise.all([
                new Token({ user: user._id, type: 'access', value: accessToken, }).save(),
                new Token({ user: user._id, type: 'refresh', value: refreshToken, }).save()
            ])
            .then(() => {
                const protect = auth.protect()
                const req = new Request({ authorization: 'Bearer ' + accessToken })
                const res = new Response()
                protect(req, res, function() {

                })
                done()
            })
        })

    })

})
