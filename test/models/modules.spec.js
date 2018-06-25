const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { logger, cleanDb } = require('../_utils')
const { Module } = require('../../src/models')
const modules = require('../../src/models/modules')

describe('Modules', function() {

    before(done => {
        cleanDb()
        .then(res => done())
    })

    after(done => {
        cleanDb()
        .then(res => done())
    })

    it('should not index any modules - no modules in directory', done => {
        modules.index(Module)
        .then(() => done())
        .catch(err => done(err))
    })

})
