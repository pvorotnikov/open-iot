class SuccessResponse {
    constructor(data) {
        this.status = 'ok'
        this.data = data || {}
    }
}

class ErrorResponse {
    constructor(message, data) {
        this.status = 'error'
        this.errorMessage = message || ''
        this.data = data || {}
    }
}

module.exports = {
    SuccessResponse,
    ErrorResponse,
}
