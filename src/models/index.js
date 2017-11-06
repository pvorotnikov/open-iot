const logger = require('../lib/logger')
const nconf = require('nconf')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

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

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    accessLevel: { type: Number, default: ACCESS_LEVEL.USER },
    isDefault: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

const applicationSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    description: String,
    key: String,
    secret: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

const gatewaySchema = mongoose.Schema({
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    name: String,
    description: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

const deviceSchema = mongoose.Schema({
    gateway: { type: mongoose.Schema.Types.ObjectId, ref: 'Gateway' },
    name: String,
    description: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

const tokenSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: String,   // access, refresh
    value: String,
    created: { type: Date, default: Date.now, expires: nconf.get('REFRESH_TOKEN_EXPIRATION_TIME') * 2 }, // expire in 2 * REFRESH_TOKEN_EXPIRATION_TIME
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
}
