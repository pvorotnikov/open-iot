const express = require('express')
const router = express.Router()
const validator = require('validator')
const hat = require('hat')
const { logger, responses, auth, utils } = require('./lib')
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
                alias: a.alias,
                description: a.description,
                key: a.key,
                secret: a.secret,
                public: a.public,
                statsIn: a.statsIn,
                statsOut: a.statsOut,
                created: a.created,
                updated: a.updated,
            }
        })
        res.json(new SuccessResponse(data))
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
        alias: name.toLowerCase().replace(/\s/g, ''),
        description,
        key: utils.generateAccessKey(32),
        secret: utils.generateSecretKey(64),
    })
    app.save()
    .then(app => {
        res.json(new SuccessResponse(app))
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
                alias: a.alias,
                description: a.description,
                key: a.key,
                secret: a.secret,
                public: a.public,
                created: a.created,
                updated: a.updated,
            }
            res.json(new SuccessResponse(data))
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

    const { name, description, alias } = req.body
    const _public = req.body.public

    const updateDefintion = {}

    if (name && !validator.isEmpty(name)) {
        updateDefintion.name = name
    }

    if (alias && !validator.isEmpty(alias)) {
        updateDefintion.alias = alias.toLowerCase().replace(/\s/g, '')
    }

    if (description && !validator.isEmpty(description)) {
        updateDefintion.description = description
    }

    if (true === _public || false === _public) {
        updateDefintion.public = _public
    }

    Application.findByIdAndUpdate(req.params.id, updateDefintion)
    .where('user').eq(req.user._id)
    .then(() => {

        // setting public to false should remove
        // any rules of other users that have
        // this app in their scope
        if (false === updateDefintion.public) {
            logger.info('Removing rules that have this scope...')
            Rule.find()
            .where('scope').eq(req.params.id)
            .where('user').ne(req.user._id)
            .remove()
            .then(deleted => {
                logger.info(`${deleted.result.n} rules deleted`)
            })
            .catch(err => {
                logger.error(err.message)
            })
        }

        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// update access key
router.put('/:id/key', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    let newKey = utils.generateAccessKey(32)
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

    let newKey = utils.generateSecretKey(64)
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
                alias: g.alias,
                description: g.description,
                tags: g.tags,
                statsIn: g.statsIn,
                statsOut: g.statsOut,
                created: g.created,
                updated: g.updated,
            }
        })
        res.json(new SuccessResponse(data))
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
                scope: r.scope,
                created: r.created,
                updated: r.updated,
            }
        })
        res.json(new SuccessResponse(data))
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

module.exports = router
