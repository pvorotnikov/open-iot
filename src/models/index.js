const logger = require('../lib/logger')
const nconf = require('nconf')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

const { Schema } = mongoose

/* ================================
 * Constants
 * ================================
 */
const ACCESS_LEVEL = {
    USER: 10,
    POWER_USER: 20,
    SERVICE: 30,
    MANAGER: 40,
    ADMIN: 50,
}

/* ================================
 * Schema
 * ================================
 */

const userSchema = new Schema({
    email: { type: String, unique : true },
    password: String,
    firstName: String,
    lastName: String,
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
    description: String,
    key: String,
    secret: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})
applicationSchema.pre('remove', function(next) {
    logger.info('Cascade removing gateways attached to application ' + this._id)
    Gateway.remove({application: this._id}).exec()
    logger.info('Cascade removing rules attached to application ' + this._id)
    Rule.remove({application: this._id}).exec()
    next()
})

const gatewaySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    application: { type: Schema.Types.ObjectId, ref: 'Application' },
    name: String,
    description: String,
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

/* ================================
 * Database
 * ================================
 */

function generatePassword(password) {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds)
    const hash = bcrypt.hashSync(password, salt)
    return hash
}

function createDefaultUser() {
    User.findOne({ isDefault: true })
    .then((res) => {
        if (!res) {
            // create new user
            let defaultUser = new User({
                firstName: 'Default',
                lastName: 'User',
                email: 'admin',                      // default email
                password: generatePassword('admin'), // default password
                isDefault: true,
                accessLevel: ACCESS_LEVEL.ADMIN,
            })
            defaultUser.save()
            .then((u) => {
                logger.info(`Created default user ${u.firstName} ${u.lastName}`)
            })
        } else {
            logger.info(`Default user present`)
        }
    })
    .catch((err) => {
        logger.error(err.message)
    })
}

const connection = function() {
    return new Promise((fulfill, reject) => {
        // set up connection
        mongoose.connect('mongodb://db/openhome', { useMongoClient: true })
        .then((instance) => {
            logger.info('Connected to DB')
            createDefaultUser() // create default user for the first time
            fulfill(instance)
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
    generatePassword,
}
