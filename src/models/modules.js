const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const logger = require('../lib/logger')
const utils = require('../lib/utils')
const util = require('util')

const MODULES_DIR = path.join(__dirname, '..', 'modules')
const readdir = util.promisify(fs.readdir)

function index(Module) {
    return new Promise((fulfill, reject) => {

        let allModules = []

        Module.find()
        .then(modules => {
            allModules = modules.map(m => m.name)
        })
        .then(() => readdir(MODULES_DIR))
        .then(files => {
            let dirs = files.filter(f => fs.lstatSync(path.join(MODULES_DIR, f)).isDirectory())
            dirs.forEach(async d => {

                // TODO: read package.json to extract module meta

                if (-1 === allModules.indexOf(d)) {
                    await addNewModule(Module, d)
                } else {
                    // TODO: heal module
                }
            })
            fulfill()
        })
        .catch(err => reject(err))
    })
}

function addNewModule(Module, name) {
    return new Promise((fulfill, reject) => {

        const m = new Module({ name })

        logger.info(`Adding module ${name} to DB`)
        fulfill()

    })
}

module.exports = {
    index,
}
