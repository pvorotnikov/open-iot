const { Application, Gateway, } = require('../models')

class Context {

    constructor() {
        this.appId = null
        this.gatewayId = null
        this.topic = null
        this.message = null
        this.arguments = null
    }

    async appAlias() {
        let app = await Application.findById(this.appId)
        if (app) {
            return app.alias
        } else {
            return null
        }
    }

    async gatewayAlias() {
        let gw = await Gateway.findById(this.gatewayId)
        if (gw) {
            return gw.alias
        } else {
            return null
        }
    }

    async gatewayTags() {
        let gw = await Gateway.findById(this.gatewayId)
        if (gw) {
            return gw.tags
        } else {
            return null
        }
    }

}

module.exports = Context
