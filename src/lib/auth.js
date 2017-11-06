const nconf = require('nconf')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid/v4')

const logger = require('./logger')
const { ACCESS_LEVEL, Token } = require('../models')
const { SuccessResponse, ErrorResponse } = require('./responses')

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
        return (req, res, next) => {

            // verify header
            if (!req.headers.authorization) {
                return res.status(401).json(new ErrorResponse('No authorization header'))
            }

            // verify schema
            if (!req.headers.authorization.startsWith('Bearer ')) {
                return res.status(401).json(new ErrorResponse('Unsupported authorization schema'))
            }

            let parts = req.headers.authorization.split(' ')
            let rawToken = parts[1]

            // verify token
            verifyToken(rawToken)
            .then(data => {

                logger.debug(`Received ${data.type} token on endpoint ${req.path} for user ${data.id}`)

                Token.findOne({ user: data.id, type: data.type, value: data.key })
                .sort({created: 'desc'})
                .populate('user')
                .then(token => {
                    if (token) {

                        // check token's access level and required access level
                        if (data.accessLevel < requiredLevel) {
                            logger.warn(`Token with access level ${data.accessLevel} received whereas min lvel ${requiredLevel} is required`)
                            return res.status(403).json(new ErrorResponse('Insufficient access level'))
                        }

                        // determine token expiration
                        let diff = moment().diff(moment(token.created), 'seconds')

                        if ('access' === token.type && diff > nconf.get('ACCESS_TOKEN_EXPIRATION_TIME')) {
                            logger.info(`Time difference: ${diff} seconds for ${token.type} token -> rejecting with 401`)
                            return res.status(401).json(new ErrorResponse('Access token expired'))

                        } else if  ('refresh' === token.type && diff > nconf.get('REFRESH_TOKEN_EXPIRATION_TIME')) {
                            logger.info(`Time difference: ${diff} seconds for ${token.type} token -> rejecting with 403`)
                            return res.status(403).json(new ErrorResponse('Refresh token expired'))
                        }

                        // store user model in request
                        req.user = token.user
                        next()

                    } else {
                        return res.status(403).json(new ErrorResponse('Token does not exist'))
                    }
                })
            })
            .catch(err => {
                return res.status(403).json(new ErrorResponse('Invalid token'))
            })
        }
    }
}
