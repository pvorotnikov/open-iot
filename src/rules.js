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

    const sourceAppId = req.params.source
    const destAppId = req.params.destination

    Rule
    .where('application').eq(sourceAppId)
    .where('user').eq(req.user._id)
    .then(res => {
        logger.info(res.length)
    })
    .catch(err => {
        logger.error(err.message)
    })


    logger.info(`Copying rules from ${sourceAppId} to ${destAppId}`)

    res.json(new SuccessResponse([]))

})

module.exports = router
