const fs = require('fs')
const mv = require('mv')
const hat = require('hat')
const util = require('util')
const path = require('path')
const bcrypt = require('bcrypt')
const qs = require('qs')
const url = require('url')

const fsAccess = util.promisify(fs.access)
const fsUnlink = util.promisify(fs.unlink)
const fsRename = util.promisify(fs.rename)
const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)
const fsRmdir = util.promisify(fs.rmdir)
const mvPromise = util.promisify(mv)

function generatePassword(password) {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds)
    const hash = bcrypt.hashSync(password, salt)
    return hash
}

function generateAccessKey(size=64) {
    return hat(size, 16)
}

function generateSecretKey(size=128) {
    return hat(size, 16)
}

async function fileExists(filename) {
    try {
        await fsAccess(filename, fs.constants.F_OK)
        return true
    } catch (err) {
        return false
    }
}

async function unlinkDirectory(dir) {
    const files = await readdir(dir)
    await Promise.all(files.map(f => fsUnlink(path.join(dir, f))))
    await fsRmdir(dir)
}

async function move(source, destination) {
    await mvPromise(source, destination, {mkdirp: true})
}

function applyFilters(req, query, allowedFields=[], allowedOps=['eq']) {
    const filters = qs.parse(url.parse(req.url).query)
    if (Object.keys(filters).length) {
        for (let field in filters) {
            let isAllowed = false
            allowedFields.forEach(regex => {
                let match = field.match(regex)
                if (match) {
                    isAllowed = true
                }
            })
            if (isAllowed) {
                for (let op in filters[field]) {
                    if (allowedOps.includes(op)) {
                        query = query.where(field)[op](filters[field][op])
                    }
                }
            }
        }
    }
    return query
}

module.exports = {
    generatePassword,
    generateAccessKey,
    generateSecretKey,
    fileExists,
    writeFile,
    readdir,
    move,
    renameFile: fsRename,
    unlinkFile: fsUnlink,
    unlinkDir: unlinkDirectory,

    applyFilters,
}
