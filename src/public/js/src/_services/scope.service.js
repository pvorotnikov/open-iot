import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const scopeService = {
    getAll,
}

/**
 * Get all scopes request
 * @return {Promise} response promise
 */
function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/scopes', requestOptions)
}
