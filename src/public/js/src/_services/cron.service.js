import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const cronService = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
}

/**
 * Get all crons
 * @returns {Promise<Object>} response promise
 */
function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/crons', requestOptions)
}

/**
 * Get a single cron by id
 * @param  {String} id cron id
 * @returns {Promise<Object>} response promise
 */
function getById(id) {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send(`/api/crons/${id}`, requestOptions)
}

/**
 * Create a new cron
 * @param {Object} cron new cron definition
 * @returns {Promise<Object>} response promise
 */
function create(cron) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify(cron),
    }
    return new Request().send('/api/crons', requestOptions)
}

/**
 * Update cron
 * @param  {String} id cron id
 * @param  {Object} cron cron update
 * @returns {Promise<Object>} response promise
 */
function update(id, cron) {
    const requestOptions = {
        method: 'PUT',
        headers: jsonHeader(),
        body: JSON.stringify(cron),
    }
    return new Request().send(`/api/crons/${id}`, requestOptions)
}

/**
 * Delete crons
 * @param  {String} id crons id
 * @returns {Promise<Object>} response promise
 */
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
    }
    return new Request().send(`/api/crons/${id}`, requestOptions)
}
