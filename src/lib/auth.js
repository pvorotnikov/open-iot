const nconf = require('nconf')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid/v4')

const logger = require('./logger')
const { Token } = require('../models')
const { SuccessResponse, ErrorResponse } = require('./responses')

function storeTokens(u, accessKey, refreshKey) {
    // store access token
    let accessToken = new Token({ user: u._id, type: 'access', value: accessKey, })
    accessToken.save()
    .then(result => logger.info(`Access token saved for user ${u._id}`))
    .catch(err => logger.warn(`Error saving access token for user ${u._id}: ${err.message}`))

    // store refresh token
    let refreshToken = new Token({ user: u._id, type: 'refresh', value: refreshKey, })
    refreshToken.save()
    .then(result => logger.info(`Refresh token saved for user ${u._id}`))
    .catch(err => logger.warn(`Error saving refresh token for user ${u._id}: ${err.message}`))
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
        return {
            accessToken: accessTokenValue,
            refreshToken: refreshTokenValue,
        }
    },

    protect: (requiredLevel) => {
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
            let token = parts[1]

            // verify token
            verifyToken(token)
            .then(data => {
                logger.debug(`Received ${data.type} token for user ${data.id}`)
                Token.findOne({ user: data.id, type: data.type, value: data.key })
                .sort({created: 'desc'})
                .then(token => {
                    if (token) {
                        let diff = moment().diff(moment(token.created), 'seconds')
                        logger.info(`Time difference: ${diff} seconds`)
                        if (diff > 10) {
                            return res.status(401).json(new ErrorResponse('Token expired'))
                        }
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
