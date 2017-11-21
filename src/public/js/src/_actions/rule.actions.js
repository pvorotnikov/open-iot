import { ruleConstants } from '../_constants'
import { ruleService } from '../_services'
import { alertActions } from './'

// export actions
export const ruleActions = {
    clear,
    getAll,
    create,
    delete: _delete,
}

function clear() {
    return { type: ruleConstants.CLEAR }
}

/**
 * Get all rules associated with an application
 * @param  {String} id application id
 * @return {Function} get rules async action
 */
function getAll(id) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        ruleService.getAll(id)
        .then(rules => {
            dispatch(success(rules))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: ruleConstants.GETALL_REQUEST } }
    function success(rules) { return { type: ruleConstants.GETALL_SUCCESS, rules } }
    function failure(error) { return { type: ruleConstants.GETALL_FAILURE, error } }
}

/**
 * Create a new rule
 * @param {Object} rule rule definition
 * @return {Function} create async action
 */
function create(rule) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        ruleService.create(rule)
        .then(rule => {
            dispatch(success(rule))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: ruleConstants.CREATE_REQUEST } }
    function success(rule) { return { type: ruleConstants.CREATE_SUCCESS, rule } }
    function failure(error) { return { type: ruleConstants.CREATE_FAILURE, error } }
}

/**
 * Delete rule
 * @param {Object} id rule id
 * @return {Function} delete async action
 */
function _delete(id) {
    return dispatch => {
        dispatch(request(id))

        // perform async operation
        ruleService.delete(id)
        .then(() => {
            dispatch(success(id))
        })
        .catch(error => {
            dispatch(failure(id, error))
            dispatch(alertActions.error(error))
        })
    }

    function request(id) { return { type: ruleConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: ruleConstants.DELETE_SUCCESS, id } }
    function failure(error) { return { type: ruleConstants.DELETE_FAILURE, id, error } }
}
