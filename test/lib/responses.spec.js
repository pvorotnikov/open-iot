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
const { SuccessResponse, ErrorResponse } = responses

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
        response.should.have.all.keys('status', 'errorMessage', 'data')
        response.status.should.equal('error')
        response.errorMessage.should.equal('')
        response.data.should.deep.equal({})
    })

    it('should create success response - message and data', () => {
        let response = new ErrorResponse('test', {test: 321})
        response.should.be.an.instanceof(ErrorResponse)
        response.should.have.all.keys('status', 'errorMessage', 'data')
        response.status.should.equal('error')
        response.errorMessage.should.equal('test')
        response.data.should.deep.equal({ test: 321 })
    })

})
