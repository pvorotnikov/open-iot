const express = require('express')
const router = express.Router()
const Promise = require('bluebird')
const { logger, responses, auth } = require('./lib')
const { ACCESS_LEVEL, Application } = require('./models')
const { SuccessResponse, ErrorResponse } = responses

// get available scopes
router.get('/', auth.protect(ACCESS_LEVEL.USER), (req, res, next) => {

    // fetch own apps
    let ownApps = Application.find().where('user').eq(req.user._id)

    // fetch public apps
    let publicApps = Application.find().where('public').eq(true).where('user').ne(req.user._id)

    Promise.all([ownApps, publicApps])
    .then(values => {
        const [oa, pa] = values
        let data = oa.map(a => ({ id: a.id, name: a.name, own: true }))
        .concat(pa.map(a => ({ id: a.id, name: a.name, own: false })))

        res.json({ status: 'ok', data })
    })
    .catch((err) => {
        res.status(500).json(new ErrorResponse(err.message))
    })

})

module.exports = router
