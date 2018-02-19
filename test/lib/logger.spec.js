const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { logger } = require('../../src/lib')

describe('Responses', function() {

    it('should log message', () => {
        logger.stream.should.be.an('object')
        logger.stream.write.should.be.a('function')
        expect(logger.stream.write.bind(null, 'test log', 'utf8')).to.not.throw()
    })

})
