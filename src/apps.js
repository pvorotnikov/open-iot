const express = require('express')
const validator = require('validator')
const hat = require('hat')
const _ = require('lodash')
const { logger, responses, auth, utils } = require('./lib')
const { ACCESS_LEVEL, Application, Gateway, Rule } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError, ERROR_CODES } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/apps', router)

    // fetch all apps that belong to the user
    router.get('/', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {
            const apps = await Application.find().where('user').eq(req.user._id)
            const data = apps.map(a => ({
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
            }))
            res.json(new SuccessResponse(data))
        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // create new app
    router.post('/', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const { name, description } = req.body

            if (_.isEmpty(name)) {
                throw new HTTPError('Please, enter application name', 400, ERROR_CODES.MISSING_DATA)
            }

            if (_.isEmpty(description)) {
                throw new HTTPError('Please, enter application description', 400, ERROR_CODES.MISSING_DATA)
            }

            let app = new Application({
                user: req.user._id,
                name,
                alias: name.toLowerCase().replace(/\s/g, ''),
                description,
                key: utils.generateAccessKey(32),
                secret: utils.generateSecretKey(64),
            })
            await app.save()
            res.json(new SuccessResponse(app))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // get single app
    router.get('/:id', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {
            const a = await Application.findById(req.params.id).where('user').eq(req.user._id)
            if (!a) {
                throw new HTTPError('Application not found', 400, ERROR_CODES.NOT_FOUND)
            }

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

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // update app
    router.put('/:id', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const { name, description, alias } = req.body

            const updateDefintion = {}

            if (!_.isEmpty(name)) {
                updateDefintion.name = name
            }

            if (!_.isEmpty(alias)) {
                updateDefintion.alias = alias.toLowerCase().replace(/\s/g, '')
            }

            if (!_.isEmpty(description)) {
                updateDefintion.description = description
            }

            if (_.isBoolean(req.body.public)) {
                updateDefintion.public = req.body.public
            }

            await Application.findByIdAndUpdate(req.params.id, updateDefintion)
            .where('user').eq(req.user._id)

            // setting public to false should remove
            // any rules of other users that have
            // this app in their scope
            if (false === updateDefintion.public) {
                logger.info('Removing rules that have this scope...')
                const deleted = await Rule.find()
                .where('scope').eq(req.params.id)
                .where('user').ne(req.user._id)
                .remove()
                logger.info(`${deleted.result.n} rules deleted`)
            }

            res.json(new SuccessResponse())

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // update access key
    router.put('/:id/key', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            let newKey = utils.generateAccessKey(32)

            await Application.findByIdAndUpdate(req.params.id, {key: newKey})
            .where('user').eq(req.user._id)

            res.json(new SuccessResponse({ key: newKey }))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // update secret key
    router.put('/:id/secret', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            let newKey = utils.generateSecretKey(64)

            await Application.findByIdAndUpdate(req.params.id, {secret: newKey})
            .where('user').eq(req.user._id)

            res.json(new SuccessResponse({ secret: newKey }))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // delete app
    router.delete('/:id', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const app = await Application.findById(req.params.id).where('user').eq(req.user._id)
            if (!app) {
                throw new HTTPError('Application not found', 400, ERROR_CODES.NOT_FOUND)
            }

            await app.remove()
            res.json(new SuccessResponse())

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // get all gateways that belong to this app
    router.get('/:id/gateways', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const gateways = await Gateway.find()
            .where('application').eq(req.params.id)
            .where('user').eq(req.user._id)

            const data = gateways.map(g => {
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

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

    // get all rules that belong to this app
    router.get('/:id/rules', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const rules = await Rule.find()
            .where('application').eq(req.params.id)
            .where('user').eq(req.user._id)

            const data = rules.map(r => {
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

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }

    })

}
