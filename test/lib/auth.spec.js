const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const hat = require('hat')

const { cleanDb, logger, objectId, Response, Request } = require('../_utils')

const { utils } = require('../../src/lib')
const { Application, Gateway, Rule, User, Token, ACCESS_LEVEL } = require('../../src/models')
const auth = rewire('../../src/lib/auth')

describe('Authentication', function() {

    let user, application

    const verifyToken = auth.__get__('verifyToken')
    const storeTokens = auth.__get__('storeTokens')
    const createToken = auth.__get__('createToken')

    before(async () => {
        await cleanDb()
        user = await new User({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.com',
            password: utils.generatePassword('test'),
        }).save()
        application = await new Application({
            user: user._id,
            name: 'Test app',
            alias: 'testapp',
            description: 'test app description',
            key: hat(32),
            secret: hat(64),
        }).save()
    })

    after(async () => {
        await cleanDb()
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

        it('should create tokens', async () => {

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
            setImmediate(() => done())
        })

    })

    /* ============================
     * PROTECT SUITE
     * ============================
     */

    describe('Protect', function() {

        it('protect: should reject - no header', async () => {

            const protect = auth.protect()
            const req = Request()
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(401)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('No authorization header')
        })

        it('protect: should reject - wrong schema', async () => {

            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Wrong ' } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(401)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Unsupported authorization schema')
        })

        /* ============================
         * PROTECT: BEARER
         * ============================
         */

        it('protect bearer: should reject - invalid bearer', async () => {

            const verifyTokenSpy = sinon.spy(verifyToken)
            auth.__set__('verifyToken', verifyTokenSpy)

            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Bearer wrong' } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Invalid token')
            verifyTokenSpy.should.have.been.called

        })

        it('protect bearer: should reject - token does not exist', async () => {

            const token = createToken({ 'test': 123 })
            const verifyTokenSpy = sinon.spy(verifyToken)
            auth.__set__('verifyToken', verifyTokenSpy)

            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Bearer ' + token } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)


            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Token does not exist')
            verifyTokenSpy.should.have.been.calledWith(token)
        })

        it('protect bearer: should reject - insufficient token access level', async () => {

            let accessToken = createToken({ key: 'access-key', type: 'access', accessLevel: user.accessLevel, id: user._id, })
            let refreshToken = createToken({ key: 'refresh-key', type: 'refresh', accessLevel: user.accessLevel, id: user._id, })

            await Promise.all([
                new Token({ user: user._id, type: 'access', value: 'access-key', }).save(),
                new Token({ user: user._id, type: 'refresh', value: 'refresh-key', }).save()
            ])

            const protect = auth.protect(ACCESS_LEVEL.ADMIN)
            const req = Request({ headers: { authorization: 'Bearer ' + accessToken } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Insufficient access level')
        })

        it('protect bearer: should reject - db error', async () => {

            const tokenFindStub = sinon.stub(Token, 'findOne').returns({
                sort: sinon.stub().returnsThis(),
                populate: sinon.stub().rejects(new Error('DB Error')),
            })
            const token = createToken({ 'test': 123 })
            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Bearer ' + token } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            tokenFindStub.restore()

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(500)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('DB Error')
        })

        it('protect bearer: should allow - valid token', async () => {

            let accessToken = createToken({ key: 'access-key', type: 'access', accessLevel: user.accessLevel, id: user._id, })
            let refreshToken = createToken({ key: 'refresh-key', type: 'refresh', accessLevel: user.accessLevel, id: user._id, })
            await Promise.all([
                new Token({ user: user._id, type: 'access', value: 'access-key', }).save(),
                new Token({ user: user._id, type: 'refresh', value: 'refresh-key', }).save()
            ])

            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Bearer ' + accessToken } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.have.been.called
            req.user.should.not.be.null
            req.user.should.be.an('object')
            req.user._id.toString().should.equal(user._id.toString())
        })


        /* ============================
         * PROTECT: BASIC
         * ============================
         */

        it('protect basic: should reject - improper credentials', async () => {

            const credentials = Buffer.from('wrong:wronger').toString('base64')
            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Credentials do not exist')
        })

        it('protect basic: should reject - improper secret', async () => {

            const credentials = Buffer.from(`${user.key}:wronger`).toString('base64')
            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Credentials do not exist')
        })

        it('protect basic: should reject - improper key', async () => {

            const credentials = Buffer.from(`wrong:${user.secret}`).toString('base64')
            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Credentials do not exist')
        })

        it('protect basic: should reject - insufficient credentials access level', async () => {

            const credentials = Buffer.from(`${user.key}:${user.secret}`).toString('base64')
            const protect = auth.protect(ACCESS_LEVEL.ADMIN)
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Insufficient access level')
        })

        it('protect basic: should reject - db error', async () => {

            const userFindStub = sinon.stub(User, 'findOne').rejects(new Error('DB Error'))
            const credentials = Buffer.from(`${user.key}:${user.secret}`).toString('base64')
            const protect = auth.protect(ACCESS_LEVEL.ADMIN)
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            userFindStub.restore()

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(500)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('DB Error')
        })

        it('protect basic: should allow - valid credentials', async () => {
            const credentials = Buffer.from(`${user.key}:${user.secret}`).toString('base64')
            const protect = auth.protect()
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await protect(req, res, next)

            next.should.have.been.called
            req.user.should.not.be.null
            req.user.should.be.an('object')
            req.user._id.toString().should.equal(user._id.toString())
        })

        /* ============================
         * BASIC
         * ============================
         */

        it('basic: should reject - no header', async () => {

            const basic = auth.basic()
            const req = Request()
            const res = Response()
            const next = sinon.stub()
            await basic(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(401)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('No authorization header')
        })

        it('basic: should reject - wrong schema', async () => {

            const basic = auth.basic()
            const req = Request({ headers: { authorization: 'Wrong ' } })
            const res = Response()
            const next = sinon.stub()
            await basic(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(401)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Unsupported authorization schema')
        })

        it('basic: should reject - invalid credentials', async () => {

            const credentials = Buffer.from('key:secret').toString('base64')
            const basic = auth.basic()
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await basic(req, res, next)

            next.should.not.have.been.called
            res.status.should.have.been.calledWith(403)
            res.json.should.have.been.called
            const args = res.json.getCall(0).args
            args[0].status.should.equal('error')
            args[0].errorMessage.should.equal('Invalid credentials')
        })

        it('basic: should allow - valid credentials', async () => {
            const credentials = Buffer.from(`${application.key}:${application.secret}`).toString('base64')
            const basic = auth.basic()
            const req = Request({ headers: { authorization: 'Basic ' + credentials } })
            const res = Response()
            const next = sinon.stub()
            await basic(req, res, next)

            next.should.have.been.called
            req.user.should.not.be.null
            req.user.should.be.an('object')
            req.user._id.toString().should.equal(user._id.toString())
            req.application.should.not.be.null
            req.application.should.be.an('object')
            req.application._id.toString().should.equal(application._id.toString())
        })

    })

})
