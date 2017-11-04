const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { logger, responses } = require('./lib')
const DB = require('./models')

const User = DB.User;
const { SuccessResponse, ErrorResponse } = responses

// perform login
router.post('/passport/auth', (req, res, next) => {

    User.findOne({ email: req.body.email })
    .then((u) => {
        if (u) {
            if (bcrypt.compareSync(req.body.password, u.password)) {
                let user =  {
                    firstName: u.firstName,
                    lastName: u.lastName,
                    accessLevel: u.accessLevel,
                    accessToken: 'fake-access-token',
                    refreshToken: 'fake-refresh-token',
                    id: u._id,
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

router.get('/users', (req, res, next) => {

    User.find()
    .then((users) => {
        let data = users.map(u => ({
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

module.exports = router
