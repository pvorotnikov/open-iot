const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { logger, cleanDb } = require('../_utils')
const models = require('../../src/models')

describe('Models', function() {

    before(done => {
        cleanDb()
        .then(res => done())
    })

    after(done => {
        cleanDb()
        .then(res => done())
    })

    it('should export models', () => {
        models.User.should.be.a('function')
        models.Application.should.be.a('function')
        models.Gateway.should.be.a('function')
        models.Device.should.be.a('function')
        models.Token.should.be.a('function')
        models.Rule.should.be.a('function')
        models.Setting.should.be.a('function')
        models.Module.should.be.a('function')
        models.Integration.should.be.a('function')
        models.PipelineStep.should.be.a('function')

        models.ACCESS_LEVEL.should.be.an('object')
        models.connection.should.be.a('function')
    })

    it('should create and remove user', done => {
        new models.User({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.com',
            password: 'test123',
            accessLevel: models.ACCESS_LEVEL.ADMIN,
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove application', done => {
        new models.Application({
            name: 'Test',
            alias: 'test',
            description: 'Test app',
            key: 'key',
            secret: 'secret',
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove gateway', done => {
        new models.Gateway({
            name: 'Test',
            alias: 'test',
            description: 'Test gateway',
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove rule', done => {
        new models.Rule({
            topic: 'test',
            transformation: null,
            action: 'discard',
            output: null,
            scope: null,
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove device', done => {
        new models.Device({
            name: 'Test',
            description: 'Test Device',
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove token', done => {
        new models.Token({
            type: 'test',
            value: 'test-token',
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove setting', done => {
        new models.Setting({
            key: 'test',
            value: 'test-setting',
            description: 'Test Setting',
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove module', done => {
        new models.Module({
            name: 'com.example.test',
            description: 'test-module',
            meta: {},
            status: 'enabled',
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove integration', done => {
        new models.Integration({
            topic: 'test',
            pipeline: [],
            output: null,
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

    it('should create and remove pipeline step', done => {
        new models.PipelineStep({
            status: 'enabled',
        }).save()
        .then(r => {
            r.should.be.an('object')
            return r.remove()
        })
        .then(r => {
            r.should.be.an('object')
        })
        .finally(() => done())
    })

})
