import { jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const tagService = {
    getAll,
    create,
    update,
    delete: _delete,
}

/**
 * Get all tags
 * @return {Promise} response promise
 */
function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/tags', requestOptions)
}

/**
 * Create a new tag
 * @param {Object} tag new tag definition
 * @return {Promise} response promise
 */
function create(tag) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify(tag),
    }
    return new Request().send('/api/tags', requestOptions)
}

/**
 * Update existing tag
 * @param  {String} id
 * @param  {Object} tag
 * @return {Promise} response promise
 */
function update(id, tag) {
    const requestOptions = {
        method: 'PUT',
        headers: jsonHeader(),
        body: JSON.stringify(tag),
    }
    return new Request().send('/api/tags/' + id, requestOptions)
}

/**
 * Delete tag
 * @param  {String} id
 * @return {Promise} response promise
 */
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
    }
    return new Request().send('/api/tags/' + id, requestOptions)
}
