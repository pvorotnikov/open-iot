import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const appService = {
    getAll,
    create,
    getById,
    update,
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

/**
 * Get a single application by id
 * @param  {String} id application id
 * @return {Promise} response promise
 */
function getById(id) {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/apps/' + id, requestOptions)
}

/**
 * Updaet application
 * @param  {String} id  application id
 * @param  {Object} app application update
 * @return {Promise} response promise
 */
function update(id, app) {
    const requestOptions = {
        method: 'PUT',
        headers: jsonHeader(),
        body: JSON.stringify(app),
    }
    return new Request().send('/api/apps/' + id, requestOptions)
}
