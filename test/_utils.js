const nconf = require('nconf')
const Promise = require('bluebird')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const { User, Application, Gateway, Device, Token, Rule, Setting, Module, Integration, PipelineStep, Plugin, } = require('../src/models')
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
        Plugin.deleteMany({})
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

module.exports = {
    cleanDb,
    expressApp,
    logger,
    objectId,
    isObjectId,
}
