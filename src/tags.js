const express = require('express')
const Promise = require('bluebird')
const _ = require('lodash')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Tag, } = require('./models')
const { SuccessResponse, ErrorResponse, HTTPError } = responses

module.exports = function(app) {

    const router = express.Router()
    app.use('/api/tags', router)

    // fetch all tags
    router.get('/', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {
            const tags = await Tag.find()

            const data = tags.map(t => ({
                id: t.id,
                name: t.name,
                constraint: t.constraint,
                created: t.created,
                updated: t.updated,
            }))
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    // create new tag
    router.post('/', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            const { name, constraint, } = req.body

            if (_.isEmpty(name)) {
                throw new HTTPError('Name is required', 400)
            }

            if (_.isEmpty(constraint)) {
                throw new HTTPError('Constraint is required', 400)
            }

            const tag = new Tag({ name, constraint })
            await tag.save()

            const data = {
                id: tag.id,
                name: tag.name,
                constraint: tag.constraint,
                created: tag.created,
                updated: tag.updated,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    // update tag
    router.put('/:id', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            const { name, constraint, } = req.body

            const updateDefintion = {}

            if (!_.isEmpty(name)) {
                updateDefintion.name = name
            }

            if (!_.isEmpty(constraint)) {
                updateDefintion.constraint = constraint
            }

            const tag = await Tag.findByIdAndUpdate(req.params.id, updateDefintion)
            if (!tag) {
                throw new HTTPError('Tag does not exist', 400)
            }

            const data = {
                id: tag.id,
                name: tag.name,
                constraint: tag.constraint,
                created: tag.created,
                updated: tag.updated,
            }
            res.json(new SuccessResponse(data))

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

    // delete tag
    router.delete('/:id', auth.protect(ACCESS_LEVEL.MANAGER), async (req, res, next) => {

        try {

            const tag = await Tag.findById(req.params.id)
            if (!tag) {
                throw new HTTPError('Tag does not exist', 400)
            }

            await tag.remove()
            res.json(new SuccessResponse())

        } catch (err) {
            res.status(err.status || 500).json(new ErrorResponse(err.message, err.code))
        }
    })

}
