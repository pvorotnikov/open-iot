const express = require('express')
const router = express.Router()
const validator = require('validator')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Gateway, Application } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch gateway by id that belongs to a particular user
router.get('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Gateway
    .findById(req.params.id)
    .where('user').eq(req.user._id)
    .then((g) => {
        if (a) {
            let data = {
                id: g.id,
                name: g.name,
                alias: g.alias,
                description: g.description,
                created: g.created,
                updated: g.updated,
            }
            res.json({ status: 'ok', data })
        } else {
            res.status(400).json(new ErrorResponse('Gateway not found'))
        }
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// create new gateway
router.post('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    const { application, name, description } = req.body

    if (validator.isEmpty(application)) {
        return res.status(400).json(new ErrorResponse('You need to specify a parent application'))
    }

    if (validator.isEmpty(name)) {
        return res.status(400).json(new ErrorResponse('Please, enter gateway name'))
    }

    if (validator.isEmpty(description)) {
        return res.status(400).json(new ErrorResponse('Please, enter gateway description'))
    }

    // check the owner of the application
    Application.findById(application)
    .where('user').eq(req.user._id)
    .then(app => {

        if (!app) {
            throw new Error('This application belongs to somebody else')
        }

        let gateway = new Gateway({
            user: req.user._id,
            application,
            name,
            alias: name.toLowerCase().replace(/\s/g, ''),
            description,
        })
        return gateway.save()
    })
    .then(gateway => {
        let data = {
            id: gateway.id,
            name: gateway.name,
            alias: gateway.alias,
            description: gateway.description,
            created: gateway.created,
            updated: gateway.updated,
        }
        res.json({ status: 'ok', data })
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// update gateway
router.put('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    const { name, description, alias } = req.body

    const updateDefintion = {}

    if (name && !validator.isEmpty(name)) {
        updateDefintion.name = name
    }

    if (alias && !validator.isEmpty(alias)) {
        updateDefintion.alias = alias
    }

    if (description && !validator.isEmpty(description)) {
        updateDefintion.description = description
    }

    Gateway.findByIdAndUpdate(req.params.id, updateDefintion)
    .where('user').eq(req.user._id)
    .then(() => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// delete gateway
router.delete('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Gateway.findById(req.params.id)
    .where('user').eq(req.user._id)
    .then(gateway => gateway.remove())
    .then(() => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

module.exports = router
