const express = require('express')
const _ = require('lodash')
const { CronJob } = require('cron')
const { responses, auth, logger } = require('./lib')
const { ACCESS_LEVEL, Cron } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError, ERROR_CODES, } = responses

module.exports = async function(app) {

    const router = express.Router()
    app.use('/api/crons', router)

    // fetch all crons
    router.get('/', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {
            const crons = await Cron.find().where('user').eq(req.user.id)
            const data = crons.map(c => ({
                id: c.id,
                cron: c.cron,
                type: c.type,
                arguments: c.arguments,
                next: c.next,
                created: c.created,
                updated: c.updated,
            }))
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    // get single cron
    router.get('/:id', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {
            const cron = await Cron.findById(req.params.id)
            .where('user').eq(req.user.id)
            if (!cron) {
                throw new HTTPError('This cron belongs to somebody else or does not exist', 400, ERROR_CODES.NOT_FOUND)
            }

            const data = {
                id: cron.id,
                cron: cron.cron,
                type: cron.type,
                arguments: cron.arguments,
                next: cron.next,
                created: cron.created,
                updated: cron.updated,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    // create cron
    router.post('/', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const { cron, type } = req.body

            if (_.isEmpty(cron)) {
                throw new HTTPError('Cron is required', 400, ERROR_CODES.MISSING_DATA)
            }

            if (_.isEmpty(type)) {
                throw new HTTPError('Type is required', 400, ERROR_CODES.MISSING_DATA)
            }

            if (_.isEmpty(req.body.arguments)) {
                throw new HTTPError('Arguments are required', 400, ERROR_CODES.MISSING_DATA)
            }

            validateCronArguments(type, req.body.arguments)

            // create cron job to calculate next invocation
            const cronJob = new CronJob(cron)
            const nextExecution = cronJob.nextDates().toDate()

            // create entry
            const newCron = new Cron({
                user: req.user.id,
                cron,
                type,
                arguments: req.body.arguments,
                next: nextExecution
            })
            await newCron.save()

            // return entry
            const data = {
                id: newCron.id,
                cron: newCron.cron,
                type: newCron.type,
                arguments: newCron.arguments,
                next: newCron.next,
                created: newCron.created,
                updated: newCron.updated,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    // update cron
    router.put('/:id', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const cron = await Cron.findById(req.params.id)
            .where('user').eq(req.user.id)
            if (!cron) {
                throw new HTTPError('This cron belongs to somebody else or does not exist', 400, ERROR_CODES.NOT_FOUND)
            }

            // allow update on cron schedule
            if (!_.isEmpty(req.body.cron)) {
                // create cron job to calculate next invocation
                const cronJob = new CronJob(req.body.cron)
                const nextExecution = cronJob.nextDates().toDate()

                // update fields
                cron.cron = req.body.cron
                cron.next = nextExecution
                cron.updated = Date.now()
            }

            await cron.save()

            const data = {
                id: cron.id,
                cron: cron.cron,
                type: cron.type,
                arguments: cron.arguments,
                next: cron.next,
                created: cron.created,
                updated: cron.updated,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    // delete cron
    router.delete('/:id', auth.protect(ACCESS_LEVEL.USER), async (req, res, next) => {

        try {

            const cron = await Cron.findById(req.params.id)
            .where('user').eq(req.user.id)
            if (!cron) {
                throw new HTTPError('This cron belongs to somebody else or does not exist', 400, ERROR_CODES.NOT_FOUND)
            }

            await cron.remove()

            res.json(new SuccessResponse())

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    function validateCronArguments(type, args) {
        switch (type) {
            case 'publish':
                if (_.isEmpty(args.topic)) {
                    throw new HTTPError(`Topic is required for cron type ${type}`, 400, ERROR_CODES.INVALID_DATA)
                }

                // TODO: validate topic to match the :appId/:gwId/topic/parts pattern

                if (_.isEmpty(args.payload)) {
                    throw new HTTPError(`Payload is required for cron type ${type}`, 400, ERROR_CODES.INVALID_DATA)
                }
                break
            default:
                throw new HTTPError(`Usupported cron type: ${type}`, 400, ERROR_CODES.INVALID_DATA)
        }
    }

}
