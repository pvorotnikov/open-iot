const ERROR_CODES = {
    GENERAL: 'GENERAL',
    CONSTRAINED_TAG: 'CONSTRAINED_TAG',
}

class SuccessResponse {
    constructor(data) {
        this.status = 'ok'
        this.data = data || {}
    }
}

class ErrorResponse {
    constructor(message='', code=ERROR_CODES.GENERAL, data={}) {
        this.status = 'error'
        this.errorMessage = message || ''
        this.errorCode = code || ERROR_CODES.GENERAL
        this.data = data || {}
    }
}

class HTTPError extends Error {
    constructor(message='Error', status=500, code=ERROR_CODES.GENERAL, fileName, lineNumber) {
        super(message, fileName, lineNumber)
        this.code = code
        this.status = status
    }
}

module.exports = {
    SuccessResponse,
    ErrorResponse,
    HTTPError,
    ERROR_CODES,
}
