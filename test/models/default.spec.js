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
const defaults = require('../../src/models/defaults')

describe('Defaults', function() {

    before(done => {
        cleanDb()
        .then(res => done())
    })

    after(done => {
        cleanDb()
        .then(res => done())
    })

    it('should export defaults', () => {
        defaults.user.should.be.a('function')
        defaults.settings.should.be.a('function')
    })

    it('should create default user', done => {
        defaults.user(User)
        .then(() => {
            return User.find()
        })
        .then((users) => {
            users.length.should.equal(1)
            users[0].firstName.should.equal('Default')
            users[0].lastName.should.equal('User')
            users[0].email.should.equal('admin')
            users[0].isDefault.should.equal(true)
            users[0].accessLevel.should.equal(ACCESS_LEVEL.ADMIN)
        })
        .finally(() => done())
    })

    it('should not create default user - db error', done => {

        let userFindStub = sinon.stub(User, 'findOne').rejects(new Error('user-rejection'))

        defaults.user(User)
        .then(() => {
            return User.find()
        })
        .catch((err) => {
            err.message.should.equal('user-rejection')
        })
        .finally(() => {
            userFindStub.restore()
            done()
        })
    })

    it('should create default settings', done => {
        defaults.settings(Setting)
        .then(() => {
            return Setting.find()
        })
        .then((settings) => {
            logger.info(settings.length)
        })
        .finally(() => done())
    })

    it('should not create default settings - db error', done => {

        let settingsFindStub = sinon.stub(Setting, 'find').rejects(new Error('settings-rejection'))

        defaults.settings(Setting)
        .catch((err) => {
            err.message.should.equal('settings-rejection')
        })
        .finally(() => {
            settingsFindStub.restore()
            done()
        })
    })

})
