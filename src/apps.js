const express = require('express')
const router = express.Router()
const validator = require('validator')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Application } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch all apps that belong to the user
router.get('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Application.find().where({ user: req.user._id })
    .then((apps) => {
        let data = apps.map(a => {
            return {
                id: a.id,
                name: a.name,
                description: a.description,
                key: a.key,
                secret: a.secret,
                created: a.created,
                updated: a.updated,
            }
        })
        res.json({ status: 'ok', data })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// create new app
router.post('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    const { name, description } = req.body

    if (validator.isEmpty(name)) {
        return res.status(400).json(new ErrorResponse('Please, enter application name'))
    }

    if (validator.isEmpty(description)) {
        return res.status(400).json(new ErrorResponse('Please, enter application description'))
    }

    let app = new Application({
        user: req.user._id,
        name,
        description,
        key: 'dummy-key',
        secret: 'dummy-secret',
    })
    app.save()
    .then(app => {
        res.json({ status: 'ok', data: app })
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

module.exports = router
