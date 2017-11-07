const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const validator = require('validator')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, User, generatePassword } = require('./models')
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

    User.findByIdAndRemove(req.params.id)
    .then(user => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        return res.status(500).json(new ErrorResponse(err.message))
    })

})

// update user
router.put('/:id', auth.protect(ACCESS_LEVEL.MANAGER), (req, res, next) => {

    return res.status(501).json(new ErrorResponse('Not implemented yet'))

})

module.exports = router
