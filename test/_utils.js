const nconf = require('nconf')
const Promise = require('bluebird')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const hat = require('hat')

const { User, Application, Gateway, Device, Token, Rule, Setting } = require('../src/models')
const { logger } = require('../src/lib')

function cleanDb() {
    return Promise.all([
        User.remove({}),
        Application.remove({}),
        Gateway.remove({}),
        Device.remove({}),
        Token.remove({}),
        Rule.remove({}),
        Setting.remove({})
    ])
}

function expressApp(routes) {
    const app = express()

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cookieParser())

    // bind routes
    routes.forEach(r => r(app))

    return app
}

module.exports = {
    cleanDb,
    expressApp,
    logger,
}
