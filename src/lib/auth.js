const nconf = require('nconf')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid/v4')

const logger = require('./logger')
const { ACCESS_LEVEL, Token, User, Application } = require('../models')
const { SuccessResponse, ErrorResponse, HTTPError, } = require('./responses')

function storeTokens(u, accessKey, refreshKey) {
    let accessToken = new Token({ user: u._id, type: 'access', value: accessKey, })
    let refreshToken = new Token({ user: u._id, type: 'refresh', value: refreshKey, })
    return Promise.all([accessToken.save(), refreshToken.save()])
}

function createToken(payload) {
    return jwt.sign(payload, nconf.get('ENCRYPTION_SECRET'))
}

function verifyToken(token) {
    return new Promise((fulfill, reject) => {
        jwt.verify(token, nconf.get('ENCRYPTION_SECRET'), (err, data) => {
            if (err) reject(err)
            else fulfill(data)
        })
    })
}

module.exports = {

    createTokens: (user) => {
        logger.info(`Creating tokens for user: ${user._id}`)
        let accessKey = uuidv4()
        let refreshKey = uuidv4()
        let accessTokenValue = createToken({ key: accessKey, type: 'access', accessLevel: user.accessLevel, id: user._id })
        let refreshTokenValue = createToken({ key: refreshKey, type: 'refresh', accessLevel: user.accessLevel, id: user._id })
        storeTokens(user, accessKey, refreshKey)
        .then(() => {
            logger.info(`Tokens stored for user ${user._id}`)
        })
        .catch(err => {
            logger.error(`Error storing tokens for user ${user._id}: ${err.message}`)
        })
        return { accessToken: accessTokenValue, refreshToken: refreshTokenValue, }
    },

    protect: (requiredLevel=ACCESS_LEVEL.USER) => {
        return async (req, res, next) => {

            try {

                // verify header
                if (!req.headers.authorization) {
                    throw new HTTPError('No authorization header', 401)
                }

                const isBearer = req.headers.authorization.startsWith('Bearer ')
                const isBasic = req.headers.authorization.startsWith('Basic ')

                // verify schema
                if (!isBearer && !isBasic) {
                    throw new HTTPError('Unsupported authorization schema', 401)
                }

                let parts = req.headers.authorization.split(' ')
                let rawToken = parts[1]

                // JWT auth
                if (isBearer) {

                    // verify token
                    let data = null
                    try {
                        data = await verifyToken(rawToken)
                    } catch (err) {
                        throw new HTTPError('Invalid token', 403)
                    }

                    // retreive token
                    // TODO: take the information from the token instead
                    const token = await Token.findOne({ user: data.id, type: data.type, value: data.key })
                    .sort({created: 'desc'})
                    .populate('user')

                    if (!token) {
                        throw new HTTPError('Token does not exist', 403)
                    }

                    logger.debug(`Received ${data.type} token on endpoint ${req.method} ${req.originalUrl} for user ${token.user.firstName} ${token.user.lastName}`)

                    // check token's access level and required access level
                    if (data.accessLevel < requiredLevel) {
                        logger.warn(`Token with access level ${data.accessLevel} received whereas min lvel ${requiredLevel} is required`)
                        throw new HTTPError('Insufficient access level', 403)
                    }

                    // determine token expiration
                    let diff = moment().diff(moment(token.created), 'seconds')

                    if ('access' === token.type && diff > nconf.get('ACCESS_TOKEN_EXPIRATION_TIME')) {
                        logger.info(`Time difference: ${diff} seconds for ${token.type} token -> rejecting with 401`)
                        throw new HTTPError('Access token expired', 401)

                    } else if  ('refresh' === token.type && diff > nconf.get('REFRESH_TOKEN_EXPIRATION_TIME')) {
                        logger.info(`Time difference: ${diff} seconds for ${token.type} token -> rejecting with 403`)
                        throw new HTTPError('Refresh token expired', 403)
                    }

                    // store user model in request
                    req.user = token.user
                    return next()
                }

                // key/secret auth
                if (isBasic) {

                    let credentials = Buffer.from(rawToken, 'base64').toString()
                    const [key, secret] = credentials.split(':')

                    const user = await User.findOne({ key, secret })

                    if (!user) {
                        throw new HTTPError('Credentials do not exist', 403)
                    }

                    logger.debug(`Received basic credentials on endpoint ${req.method} ${req.originalUrl} for user ${user.firstName} ${user.lastName}`)

                    // the user access level and required access level
                    if (user.accessLevel < requiredLevel) {
                        logger.warn(`Credentials with insufficient access level received whereas min lvel ${requiredLevel} is required`)
                        throw new HTTPError('Insufficient access level', 403)
                    }

                    // store user model in request
                    req.user = user
                    return next()
                }

            } catch (err) {
                return res.status(err.status || 500).json(new ErrorResponse(err.message))
            }
        }
    },

    basic: () => {
        return async (req, res, next) => {

            try {

                // verify header
                if (!req.headers.authorization) {
                    throw new HTTPError('No authorization header', 401)
                }

                // verify schema
                if (!req.headers.authorization.startsWith('Basic ')) {
                    throw new HTTPError('Unsupported authorization schema', 401)
                }

                let parts = req.headers.authorization.split(' ')
                let rawToken = parts[1]

                const values = Buffer.from(rawToken, 'base64').toString()
                const [username, password] = values.split(':')

                const application = await Application.findOne()
                .where('key').eq(username)
                .where('secret').eq(password)
                .populate('user')

                if (!application) {
                    throw new HTTPError('Invalid credentials', 403)
                }

                req.user = application.user
                req.application = application
                return next()

            } catch(err) {
                return res.status(err.status || 500).json(new ErrorResponse(err.message))
            }
        }
    }
}
