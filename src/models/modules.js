const Promise = require('bluebird')
const logger = require('../lib/logger')
const utils = require('../lib/utils')

function modules(Model) {

    return new Promise((fulfill, reject) => {

        let requiredSettings = defaultSettings.map(s => s.key)

        Model.find({ key: { $in: requiredSettings } })
        .then(res => {

            // walk through all default settings to check if there's entry in the DB
            defaultSettings.forEach(s => {

                let shouldAdd = true
                for (let i=0; i < res.length; i++) {
                    if (s.key === res[i].key) {
                        logger.debug(`Setting ${s.key} already present`)
                        shouldAdd = false
                        break
                    }
                }

                if (shouldAdd) {
                    logger.info(`Creating default setting ${s.key} -> ${s.value}...`)
                    let setting = new Model(s)
                    setting.save()
                }

            })
        })
        .then(() => {
            fulfill()
        })
        .catch(err => {
            logger.error(err.message)
            reject(err)
        })

    })
}

module.exports = {
    modules,
}
