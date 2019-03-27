const chai = require('chai')
const rewire = require('rewire')
const sinon = require('sinon')
const should = chai.should()

const { utils } = require('../../src/lib')

describe('Utils', function() {

    it('should generate a password', async () => {
        const password = utils.generatePassword('some password')
        password.should.be.a('string')
    })

    it('should not generate a password - empty pass', async () => {
        should.Throw(() => utils.generatePassword(), Error)
    })

    it('should generate a access key', async () => {
        const key = utils.generateAccessKey()
        key.should.be.a('string')
        key.length.should.equal(64/4)
    })

    it('should generate a secret key', async () => {
        const key = utils.generateSecretKey()
        key.should.be.a('string')
        key.length.should.equal(128/4)
    })

    it('should find existing file', async () => {
        const exists = await utils.fileExists(module.filename)
        exists.should.equal(true)
    })

    it('should not find non-existing file', async () => {
        const exists = await utils.fileExists('foo.bar')
        exists.should.equal(false)
    })


})
