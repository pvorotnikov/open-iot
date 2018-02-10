const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const validator = require('validator')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, User } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch all users
router.get('/', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

    User.find()
    .then((users) => {
        let data = users.map(u => ({
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            accessLevel: u.accessLevel,
            key: u.key,
            secret: u.secret,
            id: u._id
        }))
        res.json({ status: 'ok', data })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// delete user
router.delete('/:id', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

    if (req.user.id === req.params.id) {
        return res.status(400).json(new ErrorResponse('You can\'t delete yourself!'))
    }

    User.findById(req.params.id)
    .then(user => user.remove())
    .then(() => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// update user
router.put('/:id', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

    const { firstName, lastName, email, password } = req.body
    let updateParams = { firstName, lastName, email }

    if (validator.isEmpty(email)) {
        return res.status(400).json(new ErrorResponse('Please, enter an email'))
    }

    if (validator.isEmpty(firstName)) {
        return res.status(400).json(new ErrorResponse('Please, enter a first name'))
    }

    if (validator.isEmpty(lastName)) {
        return res.status(400).json(new ErrorResponse('Please, enter a last name'))
    }

    if (!validator.isEmpty(password)) {

        if (!validator.isLength(password, {min:6, max:36})) {
            return res.status(400).json(new ErrorResponse('Please, enter a password between 6 and 36 symbols'))
        }

        updateParams.password = utils.generatePassword(password)
    }

    User.findByIdAndUpdate(req.params.id, updateParams)
    .then(user => {
        res.json(new SuccessResponse(user))
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// update access key
router.put('/:id/key', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

    let newKey = utils.generateAccessKey()
    User.findByIdAndUpdate(req.params.id, {key: newKey})
    .then(user => {
        res.json(new SuccessResponse({ key: newKey }))
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })
})

// update secret key
router.put('/:id/secret', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

    let newSecret = utils.generateSecretKey()
    User.findByIdAndUpdate(req.params.id, {secret: newSecret})
    .then(user => {
        res.json(new SuccessResponse({ secret: newSecret }))
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })
})

module.exports = router
