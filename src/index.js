const path = require('path')
const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const { logger } = require('./lib')
const api = require('./api')

// create app
const app = express()

// setup logging
app.use(morgan('combined', { 'stream': logger.stream }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res) {
    res.send('hello, world!')
})

module.exports = app
