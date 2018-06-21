const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const _ = require('lodash')
const logger = require('../lib/logger')
const utils = require('../lib/utils')
const util = require('util')

const MODULES_DIR = path.join(__dirname, '..', 'modules')
const readdir = util.promisify(fs.readdir)

function index(Module) {
    return new Promise((fulfill, reject) => {

        let dbModules = []
        let dirModules = []

        Module.find()
        .then(modules => {
            dbModules = modules.map(m => m.name)
        })
        .then(() => readdir(MODULES_DIR))
        .then(files => {
            dirModules = files.filter(f => fs.lstatSync(path.join(MODULES_DIR, f)).isDirectory())
            dirModules.forEach(async d => {

                if (-1 === dbModules.indexOf(d)) {
                    // let hasPackage = fs.lstatSync(path.join(MODULES_DIR, d, 'package.json')).isFile()
                    // read package.json to extract module meta
                    let packageInfo = JSON.parse(fs.readFileSync(path.join(MODULES_DIR, d, 'package.json'), 'utf8'))
                    let moduleName = packageInfo.name || d
                    let moduleDescription = packageInfo.description || null
                    let m = new Module({ name: moduleName, description: moduleDescription, meta: packageInfo })
                    logger.info(`Adding new module ${moduleName} to DB`)
                    await m.save()
                } else {
                    // TODO: heal module
                    logger.info(`Module ${d} exists. Checking healing status`)
                }

            })
        })
        .then(() => {
            let missingModules = _.xor(dbModules, dirModules)
            missingModules.forEach(async mm => {
                await Module.findOne({ name: mm })
                .then(m => {
                    logger.warn('Missing module', m.name)
                    m.status = 'missing'
                    return m.save()
                })
                .catch(err => logger.error(err.message))

                // TODO: update pipeline step status
            })
            fulfill()
        })
        .catch(err => reject(err))
    })
}

module.exports = {
    index,
}
