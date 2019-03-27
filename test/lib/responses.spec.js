const nconf = require('nconf')
const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect

const { logger } = require('../_utils')
const { utils, responses } = require('../../src/lib')
const { SuccessResponse, ErrorResponse, HTTPError, ERROR_CODES } = responses

describe('Responses', function() {

    it('should create success response - no data', () => {
        let response = new SuccessResponse()
        response.should.be.an.instanceof(SuccessResponse)
        response.should.have.all.keys('status', 'data')
        response.status.should.equal('ok')
        response.data.should.deep.equal({})
    })

    it('should create success response - data', () => {
        let response = new SuccessResponse({test: 123})
        response.should.be.an.instanceof(SuccessResponse)
        response.should.have.all.keys('status', 'data')
        response.status.should.equal('ok')
        response.data.should.deep.equal({ test: 123 })
    })

    it('should create error response - no message and data', () => {
        let response = new ErrorResponse()
        response.should.be.an.instanceof(ErrorResponse)
        response.should.have.all.keys('status', 'errorMessage', 'errorCode', 'data')
        response.status.should.equal('error')
        response.errorMessage.should.equal('')
        response.errorCode.should.equal(ERROR_CODES.GENERAL)
        response.data.should.deep.equal({})
    })

    it('should create success response - message, code, and data', () => {
        let response = new ErrorResponse('test', ERROR_CODES.CONSTRAINED_TAG, {test: 321})
        response.should.be.an.instanceof(ErrorResponse)
        response.should.have.all.keys('status', 'errorMessage', 'errorCode', 'data')
        response.status.should.equal('error')
        response.errorMessage.should.equal('test')
        response.errorCode.should.equal(ERROR_CODES.CONSTRAINED_TAG)
        response.data.should.deep.equal({ test: 321 })
    })

    it ('should create HTTP error with status 400', () => {
        let error = new HTTPError('Test error', 400, ERROR_CODES.CONSTRAINED_TAG)
        error.status.should.equal(400)
        error.message.should.equal('Test error')
        error.code.should.equal(ERROR_CODES.CONSTRAINED_TAG)
    })

    it ('should create default HTTP error with status 500', () => {
        let error = new HTTPError()
        error.status.should.equal(500)
        error.message.should.equal('Error')
        error.code.should.equal(ERROR_CODES.GENERAL)
    })

})
