const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const moment = require('moment')
const hat = require('hat')

const { cleanDb, expressApp, objectId, } = require('./_utils')

const { utils, responses } = require('../src/lib')
const { User, Application, Rule, Gateway, ACCESS_LEVEL } = require('../src/models')
const apps = require('../src/apps')

describe('Applications', function() {

    const app = expressApp([apps])
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

    function fakeApp(app={}) {
        return {
            id: objectId(),
            user: objectId(),
            name: 'appname',
            description: 'app description',
            alias: 'appalias',
            key: hat(64, 16),
            secret: hat(128, 16),
            public: false,
            statsIn: 0,
            statsOut: 0,
            created: moment().toISOString(),
            updated: moment().toISOString(),
            remove: sinon.stub().resolves(),
            ...app,
        }
    }

    function fakeGateway(gw={}) {
        return {
            id: objectId(),
            user: objectId(),
            application: objectId(),
            name: 'gwname',
            description: 'gwdescription',
            alias: 'gwalias',
            tags: {},
            statsIn: 0,
            statsOut: 0,
            created: moment().toISOString(),
            updated: moment().toISOString(),
            ...gw,
        }
    }

    function fakeRule(rule={}) {
        return {
            id: objectId(),
            user: objectId(),
            application: objectId(),
            topic: 'topic',
            transformation: '',
            action: 'discard',
            output: '',
            scope: objectId(),
            created: moment().toISOString(),
            updated: moment().toISOString(),
            ...rule,
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
     * GET APPS
     * ============================
     */

    describe('Get apps', function() {

        it('should get all apps', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves([fakeApp()]),
            })

            const res = await request(app)
            .get('/api/apps')
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('array')
            res.body.data.length.should.equal(1)
        })

        it('should get all apps - filter', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().onFirstCall().returnsThis()
                    .onSecondCall().resolves([fakeApp()])
            })

            const res = await request(app)
            .get('/api/apps?name[eq]=appname')
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('array')
            res.body.data.length.should.equal(1)
        })

        it('should not all apps - DB Error', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .get('/api/apps')
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
        })

    })

    /* ============================
     * GET AN APP
     * ============================
     */

    describe('Get an app', function() {

        it('should get an app', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(fakeApp({ id: 'appid' })),
            })

            const res = await request(app)
            .get('/api/apps/appid')
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
            res.body.data.id.should.equal('appid')
        })

        it('should not get an app - does not exist', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const res = await request(app)
            .get('/api/apps/appid')
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(400)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.NOT_FOUND)
        })

        it('should not get an app - DB Error', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .get('/api/apps/appid')
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

    /* ============================
     * CREATE AN APP
     * ============================
     */

    describe('Create an app', function() {

        it('should create an app', async () => {

            const res = await request(app)
            .post('/api/apps')
            .set('Authorization', userAuthorization)
            .send({
                name: 'application',
                description: 'application',
            })

            res.status.should.equal(200)
            res.body.data.should.be.an('object')
        })

        it('should not create an app - missing name', async () => {

            const res = await request(app)
            .post('/api/apps')
            .set('Authorization', userAuthorization)
            .send({
                // name: 'application',
                description: 'application',
            })

            res.status.should.equal(400)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.MISSING_DATA)
        })

        it('should not create an app - missing description', async () => {

            const res = await request(app)
            .post('/api/apps')
            .set('Authorization', userAuthorization)
            .send({
                name: 'application',
                // description: 'application',
            })

            res.status.should.equal(400)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.MISSING_DATA)
        })

        it('should not create an app - DB Error', async () => {

            // create stubs
            let appStub = sinon.stub(Application.prototype, 'save')
            .rejects(new Error('DB Error'))

            const res = await request(app)
            .post('/api/apps')
            .set('Authorization', userAuthorization)
            .send({
                name: 'application',
                description: 'application',
            })

            // restore stubs
            appStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

    /* ============================
     * UPDATE AN APP
     * ============================
     */

    describe('Update an app', function() {

        it('should update an app', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(),
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}`)
            .set('Authorization', userAuthorization)
            .send({
                name: 'appname',
                description: 'appdescription',
                alias: 'appalias',
                public: true,
            })

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
        })

        it('should update an app - no change', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(),
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}`)
            .set('Authorization', userAuthorization)
            .send({})

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
        })

        it('should set public state of an app to false', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(),
            })

            let ruleStub = sinon.stub(Rule, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().returnsThis(),
                ne: sinon.stub().returnsThis(),
                remove: sinon.stub().resolves({ result: { n: 10 }})
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}`)
            .set('Authorization', userAuthorization)
            .send({
                public: false,
            })

            // restore stubs
            appStub.restore()
            ruleStub.restore()

            res.status.should.equal(200)
        })

        it('should not update an app - DB Error', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}`)
            .set('Authorization', userAuthorization)
            .send({})

            // restore stubs
            appStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

    /* ============================
     * UPDATE ACCESS KEY
     * ============================
     */

    describe('Update access key', function() {

        it('should update access key', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(),
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}/key`)
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
        })

        it('should not update access key - DB Error', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}/key`)
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

    /* ============================
     * UPDATE SECRET KEY
     * ============================
     */

    describe('Update secret key', function() {

        it('should update secret key', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(),
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}/secret`)
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
        })

        it('should not update secret key - DB Error', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findByIdAndUpdate').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .put(`/api/apps/${objectId()}/secret`)
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

    /* ============================
     * DELETE AN APP
     * ============================
     */

    describe('Delete an app', function() {

        it('should delete an app', async () => {

            // create stubs
            const appMock = fakeApp()
            let appStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(appMock),
            })

            const res = await request(app)
            .delete(`/api/apps/${objectId()}`)
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(200)
            appMock.remove.should.have.been.called
        })

        it('should not delete an app - not found', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().resolves(null),
            })

            const res = await request(app)
            .delete(`/api/apps/${objectId()}`)
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(400)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.NOT_FOUND)
        })

        it('should not delete an app - DB Error', async () => {

            // create stubs
            let appStub = sinon.stub(Application, 'findById').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub().rejects(new Error('DB Error')),
            })

            const res = await request(app)
            .delete(`/api/apps/${objectId()}`)
            .set('Authorization', userAuthorization)

            // restore stubs
            appStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

    /* ============================
     * GET GATEWAYS
     * ============================
     */

    describe('Get gateways', function() {

        it('should get all gateways that belong to an app', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub()
                    .onFirstCall().returnsThis()
                    .onSecondCall().resolves([fakeGateway()])
            })

            const res = await request(app)
            .get(`/api/apps/${objectId()}/gateways`)
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('array')
            res.body.data.length.should.equal(1)
        })

        it('should not get all gateways that belong to an app - DB Error', async () => {

            // create stubs
            let gatewayStub = sinon.stub(Gateway, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub()
                    .onFirstCall().returnsThis()
                    .onSecondCall().rejects(new Error('DB Error'))
            })

            const res = await request(app)
            .get(`/api/apps/${objectId()}/gateways`)
            .set('Authorization', userAuthorization)

            // restore stubs
            gatewayStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

    /* ============================
     * GET RULES
     * ============================
     */

    describe('Get rules', function() {

        it('should get all rules that belong to an app', async () => {

            // create stubs
            let ruleStub = sinon.stub(Rule, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub()
                    .onFirstCall().returnsThis()
                    .onSecondCall().resolves([fakeRule()])
            })

            const res = await request(app)
            .get(`/api/apps/${objectId()}/rules`)
            .set('Authorization', userAuthorization)

            // restore stubs
            ruleStub.restore()

            res.status.should.equal(200)
            res.body.data.should.be.an('array')
            res.body.data.length.should.equal(1)
        })

        it('should not get all rules that belong to an app - DB Error', async () => {

            // create stubs
            let ruleStub = sinon.stub(Rule, 'find').returns({
                where: sinon.stub().returnsThis(),
                eq: sinon.stub()
                    .onFirstCall().returnsThis()
                    .onSecondCall().rejects(new Error('DB Error'))
            })

            const res = await request(app)
            .get(`/api/apps/${objectId()}/rules`)
            .set('Authorization', userAuthorization)

            // restore stubs
            ruleStub.restore()

            res.status.should.equal(500)
            res.body.status.should.equal('error')
            res.body.errorMessage.should.equal('DB Error')
            res.body.errorCode.should.equal(responses.ERROR_CODES.GENERAL)
        })

    })

})
