const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const _ = require('lodash')
const logger = require('../lib/logger')
const utils = require('../lib/utils')
const util = require('util')

const MODULES_DIR = path.join(__dirname, '..', 'modules')
const readdir = util.promisify(fs.readdir)

/**
 * Perform module (extensions) indexing. This function
 * traverses the modules directory (MODULES_DIR) and
 * for every module found performs one of the following:
 * - Adds the module to the DB if it doesn't have a DB entry.
 *   This marks each pipeline step that has this module as "disabled".
 * - Heals the module if it is in the DB but has been missing
 * - Marks a module as missing in the DB if it is not located in the modules dir.
 *   This also marks each pipeline step that uses the missing module as "missing"
 *   so that it gets skipped upon pipeline execution.
 * @param {Module} Module model
 * @return {Promise}
 */
function index(Module, Integration) {
    return new Promise((fulfill, reject) => {

        let dbModuleNames = []
        let dbModules = []
        let dirModules = []

        Module.find()
        .then(modules => {
            dbModuleNames = modules.map(m => m.name)
            dbModules = modules
        })
        .then(() => readdir(MODULES_DIR))
        .then(files => {
            dirModules = files.filter(f => fs.lstatSync(path.join(MODULES_DIR, f)).isDirectory() && -1 === f.indexOf('ignore'))
            dirModules.forEach(async d => {

                if (-1 === dbModuleNames.indexOf(d)) {
                    // let hasPackage = fs.lstatSync(path.join(MODULES_DIR, d, 'package.json')).isFile()
                    // read package.json to extract module meta
                    let packageInfo = JSON.parse(fs.readFileSync(path.join(MODULES_DIR, d, 'package.json'), 'utf8'))
                    let moduleName = packageInfo.name || d
                    let moduleDescription = packageInfo.description || null
                    let m = new Module({ name: moduleName, description: moduleDescription, meta: packageInfo })
                    logger.info(`Adding new module ${moduleName} to DB`)
                    await m.save()
                } else {
                    // heal module
                    logger.info(`Module ${d} exists. Checking healing status`)
                    dbModules.forEach(async dbm => {
                        if (dbm.name === d && 'missing' === dbm.status) {
                            logger.info(`Healing module ${d}`)
                            dbm.status = 'enabled'
                            dbm.updated = Date.now()

                            // heal pipeline steps involving the module
                            let integrations = await Integration.find({ 'pipeline.module': new mongoose.mongo.ObjectId(dbm._id) })
                            integrations.forEach(async i => {
                                i.pipeline.forEach(s => {
                                    if (s.module.toString() === dbm._id.toString()) {
                                        logger.info(`Setting pipeline step ${s._id} to disabled`)
                                        s.status = 'disabled'
                                        s.updated = Date.now()
                                    }
                                })
                                await i.save()
                            })

                            await dbm.save()
                        }
                    })

                    // update module description
                    let packageInfo = JSON.parse(fs.readFileSync(path.join(MODULES_DIR, d, 'package.json'), 'utf8'))
                    dbModules.forEach(async dbm => {
                        if (dbm.name === packageInfo.name) {
                            dbm.description = packageInfo.description || null
                            dbm.meta = packageInfo
                            await dbm.save()
                        }
                    })
                }

            })
        })
        .then(() => {
            let missingModules = _.xor(dbModuleNames, dirModules)
            missingModules.forEach(async mm => {
                await Module.findOne({ name: mm })
                .then(m => {
                    if (m) {
                        logger.warn('Missing module', m.name)
                        m.status = 'missing'
                        return m.save()
                    }
                })
                .then(async m => {
                    // update pipeline step status to missing
                    if (m) {
                        let integrations = await Integration.find({ 'pipeline.module': new mongoose.mongo.ObjectId(m._id) })
                        integrations.forEach(async i => {
                            i.pipeline.forEach(s => {
                                if (s.module.toString() === m._id.toString()) {
                                    logger.info(`Setting pipeline step ${s._id} to missing`)
                                    s.status = 'missing'
                                    s.updated = Date.now()
                                }
                            })
                            await i.save()
                        })
                    }
                })
                .catch(err => logger.error(err.message))
            })
            fulfill()
        })
        .catch(err => reject(err))
    })
}

module.exports = {
    index,
}
