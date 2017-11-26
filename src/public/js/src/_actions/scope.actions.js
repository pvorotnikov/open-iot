import { scopeConstants } from '../_constants'
import { scopeService } from '../_services'
import { history } from '../_helpers'
import { alertActions } from './'

// export actions
export const scopeActions = {
    clear,
    getAll,
}

function clear() {
    return { type: scopeConstants.CLEAR }
}

/**
 * Get all scopes
 * @return {Function} get all async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        scopeService.getAll()
        .then(scopes => {
            dispatch(success(scopes))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: scopeConstants.GETALL_REQUEST } }
    function success(scopes) { return { type: scopeConstants.GETALL_SUCCESS, scopes } }
    function failure(error) { return { type: scopeConstants.GETALL_FAILURE, error } }
}
