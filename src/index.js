const nconf = require('nconf')
const path = require('path')
const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const { logger } = require('./lib')
const DB = require('./models')
const users = require('./users')
const apps = require('./apps')
const gateways = require('./gateways')
const passport = require('./passport')
const broker = require('./broker')
const rules = require('./rules')
const scopes = require('./scopes')
const settings = require('./settings')
const publish = require('./publish')
const modules = require('./modules')
const integrations = require('./integrations')
const plugins = require('./plugins')
const persistency = require('./persistency')
const tags = require('./tags')
const MessageHandler = require('./message-handler')
const { AwsIotBridge } = require('./bridge')

/* ================================
 * MESSAGE HANDLER AND BRIDGES
 * ================================
 */
let mh = new MessageHandler()
let awsBridge = null
async function setupServer(instance) {
    try {
        const settings = await instance.models.Setting.find()
        settings.forEach(s => nconf.set(s.key, s.value))
        mh.run()
        awsBridge = new AwsIotBridge()
    } catch (err) {
        logger.error(err.message)
    }
}

/* ================================
 * Database
 * ================================
 */
DB.connection()
.then((instance) => setupServer(instance))
.catch((err) => logger.error(err.message))

/* ================================
 * Create app
 * ================================
 */

// create app
const app = express()

// app configuration
if ('development' === nconf.get('ENV')) {
    app.set('json spaces', 2)
}

// setup middleware
app.use(morgan('combined', { 'stream': logger.stream, skip: (req, res) => { return res.statusCode < 400 } }))
app.use(bodyParser.json())
app.use(bodyParser.raw({ type: 'application/zip' }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

passport(app)
users(app)
app.use('/api/apps', apps)
gateways(app)
app.use('/api/broker', broker)
app.use('/api/rules', rules)
app.use('/api/scopes', scopes)
settings(app)
publish(app)
modules(app)
integrations(app)
plugins(app)
persistency(app)
tags(app)

// catch 404 and forward it to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use(function(err, req, res, next) {
    logger.error(err.message)
    res.status(err.status || 500)
    res.json({ status: 'error', errorMessage: err.message, data: {} })
})

module.exports = app
