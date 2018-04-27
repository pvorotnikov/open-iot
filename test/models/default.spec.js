const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { logger, cleanDb } = require('../_utils')
const { User, Setting, ACCESS_LEVEL } = require('../../src/models')
const defaults = rewire('../../src/models/defaults')

describe('Defaults', function() {

    beforeEach(done => {
        cleanDb()
        .then(res => done())
    })

    afterEach(done => {
        cleanDb()
        .then(res => done())
    })

    it('should export defaults', () => {
        defaults.user.should.be.a('function')
        defaults.settings.should.be.a('function')
    })

    it('should create default user', done => {
        defaults.user(User)
        .then(() => User.find())
        .then(users => {
            users.length.should.equal(1)
            users[0].firstName.should.equal('Default')
            users[0].lastName.should.equal('User')
            users[0].email.should.equal('admin')
            users[0].isDefault.should.equal(true)
            users[0].accessLevel.should.equal(ACCESS_LEVEL.ADMIN)
            done()
        })
    })

    it('should not create default user - db error', done => {

        const userFindStub = sinon.stub(User, 'findOne').rejects(new Error('user-rejection'))

        defaults.user(User)
        .catch(err => {
            err.message.should.equal('user-rejection')
            userFindStub.restore()
            done()
        })
    })

    it('should not create default user - already present', done => {
        const userSaveSpy = sinon.spy(User.prototype, 'save')
        const userFindStub = sinon.stub(User, 'findOne').resolves({})

        defaults.user(User)
        .then(() => {
            userSaveSpy.should.not.have.been.called
            userSaveSpy.restore()
            userFindStub.restore()
            done()
        })
    })

    it('should create default settings', done => {
        defaults.settings(Setting)
        .then(() => {
            setImmediate(() => {
                Setting.find()
                .then(settings => {
                    settings.length.should.be.gt(0)
                    done()
                })
            })
        })
    })

    it('should not create default settings - db error', done => {

        const settingsFindStub = sinon.stub(Setting, 'find').rejects(new Error('settings-rejection'))

        defaults.settings(Setting)
        .catch((err) => {
            err.message.should.equal('settings-rejection')
            settingsFindStub.restore()
            done()
        })
    })

    it('should not create default settings - already present', done => {
        const settingsSaveSpy = sinon.spy(Setting.prototype, 'save')
        const settingsFindStub = sinon.stub(Setting, 'find').resolves(defaults.__get__('defaultSettings'))

        defaults.settings(Setting)
        .then(() => {
            settingsSaveSpy.should.not.have.been.called
            settingsSaveSpy.restore()
            settingsFindStub.restore()
            done()
        })
    })

})
