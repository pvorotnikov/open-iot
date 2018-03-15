const express = require('express')
const router = express.Router()
const validator = require('validator')
const Promise = require('bluebird')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Rule, Application } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// create new rule
router.post('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    let { application, topic, transformation, action, output, scope } = req.body

    if (validator.isEmpty(application)) {
        return res.status(400).json(new ErrorResponse('You need to specify a parent application'))
    }

    if (validator.isEmpty(topic)) {
        return res.status(400).json(new ErrorResponse('Please, enter topic'))
    }

    if (validator.isEmpty(action)) {
        return res.status(400).json(new ErrorResponse('Please, enter action'))
    }

    if ('discard' != action && validator.isEmpty(output)) {
        return res.status(400).json(new ErrorResponse('Please, enter output'))
    }

    if ('discard' != action && validator.isEmpty(scope)) {
        return res.status(400).json(new ErrorResponse('Please, enter output scope'))
    }

    if ('republish' === action && 'message' === output) {
        return res.status(400).json(new ErrorResponse('"message" is a reserved topic'))
    }

    // TODO: add scope validation

    // check the owner of the application
    Application.findById(application)
    .where('user').eq(req.user._id)
    .then(app => {

        if (!app) {
            throw new Error('This application belongs to somebody else')
        }

        // trim data
        topic = topic.trim()
        transformation = transformation.trim()

        let rule = new Rule({
            user: req.user._id,
            application,
            topic,
            transformation,
            action,
            output,
            scope,
        })
        return rule.save()
    })
    .then(rule => {
        let data = {
            id: rule.id,
            topic: rule.topic,
            transformation: rule.transformation,
            action: rule.action,
            output: rule.output,
            scope: rule.scope,
            created: rule.created,
            updated: rule.updated,
        }
        res.json({ status: 'ok', data })
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// delete rule
router.delete('/:id', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    Rule.findById(req.params.id)
    .where('user').eq(req.user._id)
    .then(rule => rule.remove())
    .then(() => {
        res.json(new SuccessResponse())
    })
    .catch(err => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

// copy rules
router.post('/copy/:source/:destination', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {


    logger.info(`Copying rules from ${req.params.source} to ${req.params.destination}`)

    const sourceAppPromise =  Application.findById(req.params.source).where({  $or: [ { user: { $eq: req.user._id } }, { public: { $eq: true } } ] })
    const destAppPromise = Application.findById(req.params.destination).where('user').eq(req.user._id)
    const sourcRulesPromise = Rule.find().where('application').eq(req.params.source)

    Promise.all([ sourceAppPromise, destAppPromise, sourcRulesPromise ])
    .then(results => {

        const [sourceApp, destApp, sourceRules] = results

        if (!sourceApp) {
            throw new Error('You are not the owner of the source app or it is not public')
        }

        if (!destApp) {
            throw new Error('You are not the owner of the destination app')
        }

        let newRules = sourceRules.map(r => {
            return new Rule({
                user: req.user._id,
                application: destApp._id,
                topic: r.topic,
                transformation: r.transformation,
                action: 'discard'
            }).save()
        })

        return Promise.all(newRules)
    })
    .then((rules) => {
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
    .catch(err => {
        res.status(400).json(new ErrorResponse(err.message))
    })

})

// replace rules in destination with the ones from source
router.post('/replace/:source/:destination', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {


    logger.info(`Replacing rules in ${req.params.destination} from ${req.params.source}`)

    const sourceAppPromise =  Application.findById(req.params.source).where({  $or: [ { user: { $eq: req.user._id } }, { public: { $eq: true } } ] })
    const destAppPromise = Application.findById(req.params.destination).where('user').eq(req.user._id)
    const sourcRulesPromise = Rule.find().where('application').eq(req.params.source)

    let sourceApp, destApp, sourceRules

    Promise.all([ sourceAppPromise, destAppPromise, sourcRulesPromise ])
    .then(results => {

        const [sourceAppRes, destAppRes, sourceRulesRes] = results

        if (!sourceAppRes) {
            throw new Error('You are not the owner of the source app or it is not public')
        }

        if (!destAppRes) {
            throw new Error('You are not the owner of the destination app')
        }

        sourceApp = sourceAppRes
        destApp = destAppRes
        sourceRules = sourceRulesRes

        // remove all rules in destination app
        // WARNING: This really replaces everything int he destination app
        return Rule.remove({ 'application': destApp._id })

    })
    .then(() => {

        let newRules = sourceRules.map(r => {
            return new Rule({
                user: req.user._id,
                application: destApp._id,
                topic: r.topic,
                transformation: r.transformation,
                action: 'discard'
            }).save()
        })

        return Promise.all(newRules)
    })
    .then((rules) => {
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
    .catch(err => {
        res.status(400).json(new ErrorResponse(err.message))
    })

})

module.exports = router
