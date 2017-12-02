const CSON = require('cson')
const { logger } = require('../lib')

class Transformer {

    constructor(transformation, message) {
        this.transformation = transformation
        this.message = message

        this.transform()
    }

    transform() {
        // TODO: load transformation (try CSON and JSON)
        // TODO: perform transformation
        // TODO: think of how to cache the transformation
        logger.info(this.transformation)
        logger.info('Transforming...')
    }

    getTransformedMessage() {
        return this.message
    }

}

module.exports = Transformer
