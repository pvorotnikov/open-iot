import { tagConstants } from '../_constants'
import { tagService } from '../_services'
import { alertActions } from './'

// export actions
export const tagActions = {
    getAll,
    create,
    update,
    delete: _delete,
}

/**
 * Get all tags
 * @return {Function}
 */
function getAll() {
    return async dispatch => {
        try {
            dispatch(request())
            const tags = await tagService.getAll()
            dispatch(success(tags))
        } catch (err) {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        }
    }

    function request() { return { type: tagConstants.GETALL_REQUEST } }
    function success(tags) { return { type: tagConstants.GETALL_SUCCESS, tags } }
    function failure(error) { return { type: tagConstants.GETALL_FAILURE, error } }
}

/**
 * Get a new tag
 * @param {Object} newTag
 * @return {Function}
 */
function create(newTag) {
    return async dispatch => {
        try {
            dispatch(request())
            const tag = await tagService.create(newTag)
            dispatch(success(tag))
        } catch (err) {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        }
    }

    function request() { return { type: tagConstants.CREATE_REQUEST } }
    function success(tag) { return { type: tagConstants.CREATE_SUCCESS, tag } }
    function failure(error) { return { type: tagConstants.CREATE_FAILURE, error } }
}

/**
 * Update existing tag
 * @param {Object} updatedTag
 * @return {Function}
 */
function update(id, updatedTag) {
    return async dispatch => {
        try {
            dispatch(request())
            const tag = await tagService.update(id, updatedTag)
            dispatch(success(tag))
        } catch (err) {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        }
    }

    function request() { return { type: tagConstants.UPDATE_REQUEST } }
    function success(tag) { return { type: tagConstants.UPDATE_SUCCESS, tag } }
    function failure(error) { return { type: tagConstants.UPDATE_FAILURE, error } }
}

/**
 * Delete existing tag
 * @param {Object} id
 * @return {Function}
 */
function _delete(id) {
    return async dispatch => {
        try {
            dispatch(request())
            const tag = await tagService.delete(id)
            dispatch(success(id))
        } catch (err) {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        }
    }

    function request() { return { type: tagConstants.DELETE_REQUEST } }
    function success(id) { return { type: tagConstants.DELETE_SUCCESS, id } }
    function failure(error) { return { type: tagConstants.DELETE_FAILURE, error } }
}

