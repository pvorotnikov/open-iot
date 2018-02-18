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
const MessageHandler = require('./message-handler')
const { AwsIotBridge } = require('./bridge')

/* ================================
 * MESSAGE HANDLER AND BRIDGES
 * ================================
 */
let mh = new MessageHandler()
let awsBridge = null
function setupServer(instance) {

    instance.models.Setting.find()
    .then(settings => {
        settings.forEach(s => nconf.set(s.key, s.value))

        mh.run()
        awsBridge = new AwsIotBridge()
    })
    .catch(err => {
        logger.error(err.message)
    })
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

// setup middleware
app.use(morgan('combined', { 'stream': logger.stream, skip: (req, res) => { return res.statusCode < 400 } }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

passport(app)
app.use('/api/users', users)
app.use('/api/apps', apps)
app.use('/api/gateways', gateways)
app.use('/api/broker', broker)
app.use('/api/rules', rules)
app.use('/api/scopes', scopes)
app.use('/api/settings', settings)
app.use('/api/publish', publish)

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
