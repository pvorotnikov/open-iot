const ERROR_CODES = {
    GENERAL: 'GENERAL',
    NOT_FOUND: 'NOT_FOUND',
    CONSTRAINED_TAG: 'CONSTRAINED_TAG',
    MISSING_DATA: 'MISSING_DATA',
    INVALID_DATA: 'INVALID_DATA',
    EXPIRED_TOKEN: 'EXPIRED_TOKEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
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
