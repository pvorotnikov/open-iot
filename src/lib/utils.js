const hat = require('hat')
const bcrypt = require('bcrypt')

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

module.exports = {
    generatePassword,
    generateAccessKey,
    generateSecretKey,
}
