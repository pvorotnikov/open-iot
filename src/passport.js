const nconf = require('nconf')
const _ = require('lodash')
const express = require('express')
const bcrypt = require('bcrypt')
const validator = require('validator')
const { logger, responses, auth, utils } = require('./lib')
const { User } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError, ERROR_CODES } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/passport', router)

    // Perform basic login.
    // The response returns access token and refresh token
    router.post('/auth', async (req, res, next) => {

        try {

            const user = await User.findOne({ email: req.body.email })

            if (!user) {
                throw new HTTPError('User does not exist', 401, ERROR_CODES.NOT_FOUND)
            }

            if (!bcrypt.compareSync(req.body.password, user.password)) {
                throw new HTTPError('Wrong password', 403, ERROR_CODES.INVALID_DATA)
            }

            const { accessToken, refreshToken } = auth.createTokens(user)
            const data =  {
                firstName: user.firstName,
                lastName: user.lastName,
                accessLevel: user.accessLevel,
                id: user.id,
                accessToken,
                refreshToken,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // refresh JWT token
    router.get('/refresh', auth.protect(), (req, res, next) => {
        res.json(new SuccessResponse(auth.createTokens(req.user)))
    })

    // Register a new user
    router.post('/register', async (req, res, next) => {

        try {

            const { firstName, lastName, email, password } = req.body

            if (!nconf.get('global.enableregistrations')) {
                throw new HTTPError('Registrations are disabled', 400, ERROR_CODES.GENERAL)
            }

            if (!validator.isEmail(email)) {
                throw new HTTPError('Please, enter a valid email', 400, ERROR_CODES.INVALID_DATA)
            }

            if (!validator.isLength(password, {min:6, max:36})) {
                throw new HTTPError('Please, enter a password between 6 and 36 symbols', 400, ERROR_CODES.INVALID_DATA)
            }

            if (_.isEmpty(firstName)) {
                throw new HTTPError('Please, enter your first name', 400, ERROR_CODES.MISSING_DATA)
            }

            if (_.isEmpty(lastName)) {
                throw new HTTPError('Please, enter your last name', 400, ERROR_CODES.MISSING_DATA)
            }

            // create the user
            let user
            try {
                user = await new User({ firstName, lastName, email, password: utils.generatePassword(password) }).save()
            } catch (err) {
                if (err.code === 11000) {
                    throw new HTTPError(`The email ${email} is already in use`, 400, ERROR_CODES.INVALID_DATA)
                } else {
                    throw err
                }
            }

            // return the user
            const data = {
                firstName: user.firstName,
                lastName: user.lastName,
                accessLevel: user.accessLevel,
                id: user.id,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

} // module.exports
