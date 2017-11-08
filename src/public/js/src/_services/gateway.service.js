import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const gatewayService = {
    getAll,
}

/**
 * Get all gateways associated witn an application
 * @return {Promise} response promise
 */
function getAll(id) {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/apps/' + id + '/gateways', requestOptions)
}
