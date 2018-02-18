const Promise = require('bluebird')
const chai = require('chai')
const request = require('supertest')
const rewire = require('rewire')
const should = chai.should()
const expect = chai.expect

const { expressApp, logger } = require('./_utils')

const passport = require('../src/passport')

describe('Passport', function() {

    let app

    before((done) => {
        // create app
        app = expressApp([passport])
        done()
    })

    after((done) => {
        done()
    })

    it('should try to authenticate', done => {
        request(app)
        .post('/api/passport/auth')
        .send({ email: 'admin', password: 'admin' })
        .expect(401, done)
    })

})
