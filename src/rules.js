const express = require('express')
const router = express.Router()
const validator = require('validator')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Rule, Application } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// create new rule
router.post('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    const { application, topic, transformation, action, output, scope } = req.body

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

    if ('republish' === action && topic === output) {
        return res.status(400).json(new ErrorResponse('Output must be different from topic'))
    }

    // check the owner of the application
    Application.findById(application)
    .where('user').eq(req.user._id)
    .then(app => {

        if (!app) {
            throw new Error('This application belongs to somebody else')
        }

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

module.exports = router
