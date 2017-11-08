import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const gatewayService = {
    getAll,
    create,
    delete: _delete,
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

/**
 * Create a new gateway request
 * @param {Object} gateway new gateway definition
 * @return {Promise} response promise
 */
function create(gateway) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify(gateway),
    }
    return new Request().send('/api/gateways', requestOptions)
}

/**
 * Delete gateway
 * @param  {String} id gateway id
 * @return {Promise} response promise
 */
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
    }
    return new Request().send('/api/gateways/' + id, requestOptions)
}
