const logger = require('../lib/logger')
const utils = require('../lib/utils')
const { ACCESS_LEVEL } = require('./constants')

const defaultSettings = [
    { key: 'global.deploymentTime',     value: Date.now(), radOnly: true, },
    { key: 'bridge.aws.enabled',        value: false, },
    { key: 'bridge.aws.endpoint',       value: '', },
    { key: 'bridge.aws.certificate',    value: '', },
    { key: 'bridge.aws.publicKey',      value: '', },
    { key: 'bridge.aws.privateKey',     value: '', },
    { key: 'bridge.aws.ca',             value: '', },
]

function settings(Model) {
    // Model.remove({})
    // .then(() => Model.findOne())
    Model.findOne()
    .then(res => {
        if (!res) {
            logger.info('Crating default settings...')
            defaultSettings.forEach(s => {
                logger.info(`${s.key} -> ${s.value}`)
                let setting = new Model(s)
                setting.save()
            })

        } else {
            logger.info(`Settings present`)
        }
    })
    .catch(err => {
        logger.error(err.message)
    })
}

function user(Model) {
    Model.findOne({ isDefault: true })
    .then((res) => {
        if (!res) {
            // create new user
            let defaultUser = new Model({
                firstName: 'Default',
                lastName: 'User',
                email: 'admin',                            // default email
                password: utils.generatePassword('admin'), // default password
                isDefault: true,
                accessLevel: ACCESS_LEVEL.ADMIN,
            })
            defaultUser.save()
            .then((u) => {
                logger.info(`Created default user ${u.firstName} ${u.lastName}`)
            })
        } else {
            logger.info(`Default user present`)
        }
    })
    .catch((err) => {
        logger.error(err.message)
    })
}

module.exports = {
    settings,
    user,
}
