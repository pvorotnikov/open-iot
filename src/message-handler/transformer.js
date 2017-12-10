const CSON = require('cson')
const { ObjectTemplate } = require('json2json')
const { logger } = require('../lib')

class Transformer {

    constructor(transformationStr, messageStr) {
        this.transformationStr = transformationStr
        this.messageStr = messageStr

        // try parsing the message and the transformation
        this.message = this.tryJson()
        if (this.message) {
            this.transformation = this.tryTransformation()
        }

        // do the actual transformation if needed
        this.transformedMessage = null
        if (this.message && this.transformation) {
            this.transformedMessage = this.transform()
        } else {
            this.transformedMessage = this.messageStr
        }
    }

    transform() {
        // TODO: think of how to cache the transformation
        const o = new ObjectTemplate(this.transformation)
        const t = o.transform(this.message)
        const result = JSON.stringify(t)
        return result
    }

    tryJson() {
        let result = null
        try {
            result = JSON.parse(this.messageStr)
        } catch (err) {
            logger.debug('Unparsable message. Transformation not applicable')
        }
        return result
    }

    tryTransformation() {

        if (!this.transformationStr) {
            logger.debug('No transformation specified')
            return null
        }

        let transformation = null

        logger.debug('Loading transformation...')

        try {
            transformation = JSON.parse(this.transformationStr)
        } catch (err) {
            if (err instanceof SyntaxError) {
                let result = CSON.parse(this.transformationStr)
                if (result instanceof Error) {
                    logger.error('Unparsable transformation')
                } else {
                    transformation = result
                }
            } else {
                logger.error(err.message)
            }
        }
        return transformation
    }

    getTransformedMessage() {
        return this.transformedMessage
    }

}

module.exports = Transformer
