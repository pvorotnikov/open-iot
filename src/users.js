const express = require('express')
const validator = require('validator')
const _ = require('lodash')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, User } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError, ERROR_CODES, } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/users', router)

    // fetch all users
    router.get('/', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            const users = await User.find()
            const data = users.map(u => ({
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                accessLevel: u.accessLevel,
                key: u.key,
                secret: u.secret,
                id: u.id
            }))
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // delete user
    router.delete('/:id', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            // ensure that you don't delete yourself
            if (req.user.id === req.params.id) {
                throw new HTTPError('You can\'t delete yourself!', 400, ERROR_CODES.INVALID_DATA)
            }

            // ensure user exists
            const user = await User.findById(req.params.id)
            if (!user) {
                throw new HTTPError('User not found', 400, ERROR_CODES.NOT_FOUND)
            }

            // remove user
            await user.remove()
            res.json(new SuccessResponse())

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // update user
    router.put('/:id', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            // ensure user exists
            const user = await User.findById(req.params.id)
            if (!user) {
                throw new HTTPError('User not found', 400, ERROR_CODES.NOT_FOUND)
            }

            const { firstName, lastName, email, password } = req.body
            const updateParams = {}

            // update first name
            if (!_.isEmpty(firstName)) {
                updateParams.firstName = firstName
            }

            // update last name
            if (!_.isEmpty(lastName)) {
                updateParams.lastName = lastName
            }

            // update email
            if (!_.isEmpty(email)) {
                updateParams.email = email
            }

            // update password
            if (!_.isEmpty(password)) {
                if (!validator.isLength(password, {min:6, max:36})) {
                    throw new HTTPError('Please, enter a password between 6 and 36 symbols', 400, ERROR_CODES.INVALID_DATA)
                }
                updateParams.password = utils.generatePassword(password)
            }

            await User.findByIdAndUpdate(req.params.id, updateParams)

            const data = {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                accessLevel: user.accessLevel,
                key: user.key,
                secret: user.secret,
                id: user.id,
                ...updateParams,
            }
            delete data.password

            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // update access key
    router.put('/:id/key', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            const newKey = utils.generateAccessKey()
            await User.findByIdAndUpdate(req.params.id, {key: newKey})
            res.json(new SuccessResponse({ key: newKey }))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // update secret key
    router.put('/:id/secret', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            const newSecret = utils.generateSecretKey()
            await User.findByIdAndUpdate(req.params.id, {secret: newSecret})
            res.json(new SuccessResponse({ secret: newSecret }))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

} // module.exports
