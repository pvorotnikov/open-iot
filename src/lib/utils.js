const fs = require('fs')
const hat = require('hat')
const util = require('util')
const path = require('path')
const bcrypt = require('bcrypt')

const fsAccess = util.promisify(fs.access)
const fsUnlink = util.promisify(fs.unlink)
const fsRename = util.promisify(fs.rename)
const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)
const fsRmdir = util.promisify(fs.rmdir)

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

module.exports = {
    generatePassword,
    generateAccessKey,
    generateSecretKey,
    fileExists,
    writeFile,
    readdir,
    renameFile: fsRename,
    unlinkFile: fsUnlink,
    unlinkDir: unlinkDirectory,
}
