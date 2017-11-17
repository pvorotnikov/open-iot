const express = require('express')
const router = express.Router()
const validator = require('validator')
const hat = require('hat')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Application, Gateway, Rule } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// fetch all apps that belong to the user
router.get('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Application
    .find()
    .where('user').eq(req.user._id)
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
        key: generateAccessKey(),
        secret: generateSecretKey(),
    })
    app.save()
    .then(app => {
        res.json({ status: 'ok', data: app })
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// get single app
router.get('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Application
    .findById(req.params.id)
    .where('user').eq(req.user._id)
    .then(a => {
        if (a) {
            let data = {
                id: a.id,
                name: a.name,
                description: a.description,
                key: a.key,
                secret: a.secret,
                created: a.created,
                updated: a.updated,
            }
            res.json({ status: 'ok', data })
        } else {
            res.status(400).json(new ErrorResponse('Application not found'))
        }
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// update app
router.put('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    const { name, description } = req.body

    const updateDefintion = {}

    if (name && !validator.isEmpty(name)) {
        updateDefintion.name = name
    }

    if (description && !validator.isEmpty(description)) {
        updateDefintion.description = description
    }

    Application.findByIdAndUpdate(req.params.id, updateDefintion)
    .where('user').eq(req.user._id)
    .then(() => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// update access key
router.put('/:id/key', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    let newKey = generateAccessKey()
    Application.findByIdAndUpdate(req.params.id, {key: newKey})
    .where('user').eq(req.user._id)
    .then(a => {
        res.json(new SuccessResponse({ key: newKey }))
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })
})

// update secret key
router.put('/:id/secret', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    let newKey = generateSecretKey()
    Application.findByIdAndUpdate(req.params.id, {secret: newKey})
    .where('user').eq(req.user._id)
    .then(a => {
        res.json(new SuccessResponse({ secret: newKey }))
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })
})

// delete app
router.delete('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Application.findById(req.params.id)
    .where('user').eq(req.user._id)
    .then(app => app.remove())
    .then(() => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// get all gateways that belong to this app
router.get('/:id/gateways', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Gateway
    .where('application').eq(req.params.id)
    .where('user').eq(req.user._id)
    .then(gateways => {
        let data = gateways.map(g => {
            return {
                id: g.id,
                name: g.name,
                description: g.description,
                created: g.created,
                updated: g.updated,
            }
        })
        res.json({ status: 'ok', data })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// get all rules that belong to this app
router.get('/:id/rules', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Rule
    .where('application').eq(req.params.id)
    .where('user').eq(req.user._id)
    .then(rules => {
        let data = rules.map(r => {
            return {
                id: r.id,
                topic: r.topic,
                transformation: r.transformation,
                action: r.action,
                output: r.output,
                created: r.created,
                updated: r.updated,
            }
        })
        res.json({ status: 'ok', data })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

function generateAccessKey() {
    return hat(32, 16)
}

function generateSecretKey() {
    return hat(64, 16)
}

module.exports = router
