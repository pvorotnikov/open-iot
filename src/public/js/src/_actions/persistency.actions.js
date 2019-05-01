import { persistencyConstants } from '../_constants'
import { persistencyService } from '../_services'
import { alertActions } from './'

// export actions
export const persistencyActions = {
    get,
}

/**
 * Get all messages
 * @param {String} topic
 * @param {String} username
 * @param {String} password
 * @param {String} limit
 * @return {Function}
 */
function get(topic, username, password, limit) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        persistencyService.get(topic, username, password, limit)
        .then(messages => {
            dispatch(success(messages))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: persistencyConstants.GET_REQUEST } }
    function success(messages) { return { type: persistencyConstants.GET_SUCCESS, messages } }
    function failure(error) { return { type: persistencyConstants.GET_FAILURE, error } }
}
