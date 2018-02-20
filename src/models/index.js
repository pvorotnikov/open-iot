const Promise = require('bluebird')
const logger = require('../lib/logger')
const utils = require('../lib/utils')
const nconf = require('nconf')
const { ACCESS_LEVEL } = require('./constants')
const defaults = require('./defaults')
const mongoose = require('mongoose')
mongoose.Promise = Promise

const { Schema } = mongoose

/* ================================
 * Schema
 * ================================
 */

const userSchema = new Schema({
    email: { type: String, unique : true },
    password: String,
    firstName: String,
    lastName: String,
    key: { type: String, default: () => utils.generateAccessKey() },
    secret: { type: String, default: () => utils.generateSecretKey() },
    accessLevel: { type: Number, default: ACCESS_LEVEL.USER },
    isDefault: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})
userSchema.pre('remove', function(next) {
    logger.info('Cascade removing applications attached to user ' + this._id)
    Application.remove({user: this._id}).exec()
    next()
})

const applicationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    alias: String,
    description: String,
    key: String,
    secret: String,
    public: { type: Boolean, default: false },
    statsIn: { type: Number, default: 0 },
    statsOut: { type: Number, default: 0 },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})
applicationSchema.pre('remove', function(next) {
    logger.info('Cascade removing gateways attached to application ' + this._id)
    Gateway.remove({application: this._id}).exec()
    logger.info('Cascade removing rules attached to or associated with application ' + this._id)
    Rule.remove({application: this._id}).exec()
    Rule.remove({scope: this._id}).exec()
    next()
})

const gatewaySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    application: { type: Schema.Types.ObjectId, ref: 'Application' },
    name: String,
    alias: String,
    description: String,
    statsIn: { type: Number, default: 0 },
    statsOut: { type: Number, default: 0 },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

const deviceSchema = new Schema({
    gateway: { type: Schema.Types.ObjectId, ref: 'Gateway' },
    name: String,
    description: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

const tokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    type: String,   // access, refresh
    value: String,
    created: { type: Date, default: Date.now, expires: nconf.get('REFRESH_TOKEN_EXPIRATION_TIME') * 2 }, // expire in 2 * REFRESH_TOKEN_EXPIRATION_TIME
    updated: { type: Date, default: Date.now },
})
tokenSchema.pre('remove', function(next) {
    logger.debug(`Removing ${this.type} token: ${this._id}`)
    next()
})

const ruleSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    application: { type: Schema.Types.ObjectId, ref: 'Application' },
    topic: String,
    transformation: String,
    action: { type: String, enum: ['discard', 'republish', 'enqueue'] },
    output: String,
    scope: { type: Schema.Types.ObjectId, ref: 'Application' },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },

})

const settingSchema = new Schema({
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, required: true },
    readOnly: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

/* ================================
 * Models
 * ================================
 */
const User = mongoose.model('User', userSchema)
const Application = mongoose.model('Application', applicationSchema)
const Gateway = mongoose.model('Gateway', gatewaySchema)
const Device = mongoose.model('Device', deviceSchema)
const Token = mongoose.model('Token', tokenSchema)
const Rule = mongoose.model('Rule', ruleSchema)
const Setting = mongoose.model('Setting', settingSchema)

/* ================================
 * Database
 * ================================
 */

const connection = function() {
    return new Promise((fulfill, reject) => {
        // set up connection
        mongoose.connect(nconf.get('DB_CONNECTION'), { useMongoClient: true })
        .then((instance) => {
            logger.info('Connected to DB')

            Promise.all([
                defaults.user(User), // create default user for the first time
                defaults.settings(Setting) // create default settings
            ])
            .then(() => fulfill(instance))
        })
        .catch((err) => {
            logger.error('MongoDB connection error:', err.message)
            reject(err)
        })
    })
}

module.exports = {
    ACCESS_LEVEL,
    connection,
    User,
    Application,
    Gateway,
    Device,
    Token,
    Rule,
    Setting,
}
