const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const validator = require('validator')
const { logger, responses, auth } = require('./lib')
const { User, generatePassword } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// perform login
router.post('/auth', (req, res, next) => {

    User.findOne({ email: req.body.email })
    .then((u) => {
        if (u) {
            if (bcrypt.compareSync(req.body.password, u.password)) {
                const { accessToken, refreshToken } = auth.createTokens(u)
                let user =  {
                    firstName: u.firstName,
                    lastName: u.lastName,
                    accessLevel: u.accessLevel,
                    id: u._id,
                    accessToken,
                    refreshToken,
                }
                res.json(new SuccessResponse(user))

            } else {
                res.status(403).json(new ErrorResponse('Wrong password'))
            }
        } else {
            res.status(401).json(new ErrorResponse('User does not exist'))
        }
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// refresh token
router.get('/refresh', auth.protect(), (req, res, next) => {
    res.json(new SuccessResponse(auth.createTokens(req.user)))
})

// register user
router.post('/register', (req, res, next) => {
    const { firstName, lastName, email, password } = req.body

    if (!validator.isEmail(email)) {
        return res.status(400).json(new ErrorResponse('Please, enter a valid email'))
    }

    if (!validator.isLength(password, {min:6, max:36})) {
        return res.status(400).json(new ErrorResponse('Please, enter a password between 6 and 36 symbols'))
    }

    if (validator.isEmpty(firstName)) {
        return res.status(400).json(new ErrorResponse('Please, enter your first name'))
    }

    if (validator.isEmpty(lastName)) {
        return res.status(400).json(new ErrorResponse('Please, enter your last name'))
    }

    let newUser = new User({
        firstName,
        lastName,
        email,
        password: generatePassword(password),
    })
    newUser.save()
    .then(u => {
        res.json(new SuccessResponse({
            firstName: u.firstName,
            lastName: u.lastName,
            accessLevel: u.accessLevel,
            id: u._id,
        }))
    })
    .catch(err => {
        let message = err.code === 11000 ? `The email ${email} is already in use` : err.message
        res.status(500).json(new ErrorResponse(message))
    })

})

module.exports = router
