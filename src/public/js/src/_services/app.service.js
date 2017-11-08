import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const appService = {
    getAll,
    create,
}

/**
 * Get all applications request
 * @return {Promise} response promise
 */
function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/apps', requestOptions)
}

/**
 * Create a new application request
 * @return {Promise} response promise
 */
function create(app) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify(app),
    }
    return new Request().send('/api/apps', requestOptions)
}
