const nconf = require('nconf')
const Promise = require('bluebird')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const sinon = require('sinon')

const { User, Application, Gateway, Device, Token, Rule, Setting, Module, Integration, PipelineStep, Plugin, Tag, } = require('../src/models')
const { logger } = require('../src/lib')

function cleanDb() {
    return Promise.all([
        User.deleteMany({}),
        Application.deleteMany({}),
        Gateway.deleteMany({}),
        Device.deleteMany({}),
        Token.deleteMany({}),
        Rule.deleteMany({}),
        Setting.deleteMany({}),
        Module.deleteMany({}),
        Integration.deleteMany({}),
        PipelineStep.deleteMany({}),
        Plugin.deleteMany({}),
        Tag.deleteMany({})
    ])
}

/**
 * Create new express app, as close to the
 * real one as possible.
 */
function expressApp(routes) {
    const app = express()

    app.use(bodyParser.json())
    app.use(bodyParser.raw({ type: 'application/zip' }))
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cookieParser())

    // bind routes
    routes.forEach(r => r(app))

    return app
}

/**
 * Generate new ObjectId
 */
function objectId() {
    return mongoose.Types.ObjectId()
}

/**
 * Return true if the argument is an ObjectId
 */
function isObjectId(objId) {
    mongoose.Types.ObjectId.isValid(objId)
}

/**
 * Create a new protect mock middleware
 */
function protectMock() {
    return (req, res, next) => {
        req.user = new User({
            email: 'user@example.com',
            password: 'abcd',
            firstName: 'Example',
            lastName: 'User',
        })
        next()
    }
}

const Request = (options = {}) => ({
    body: {},
    cookies: {},
    query: {},
    params: {},
    headers: {},
    get: sinon.stub(),
    ...options
})

const Response = (options = {}) => {
    const res = {
        cookie: sinon.spy(),
        clearCookie: sinon.spy(),
        download: sinon.spy(),
        format: sinon.spy(),
        json: sinon.spy(),
        jsonp: sinon.spy(),
        send: sinon.spy(),
        sendFile: sinon.spy(),
        sendStatus: sinon.spy(),
        redirect: sinon.spy(),
        render: sinon.spy(),
        end: sinon.spy(),
        set: sinon.spy(),
        type: sinon.spy(),
        get: sinon.stub(),
        ...options
    }
    res.status = sinon.stub().returns(res)
    res.vary = sinon.stub().returns(res)
    return res
}

module.exports = {
    cleanDb,
    expressApp,
    logger,
    objectId,
    isObjectId,
    protectMock,
    Response,
    Request,
}
