import { appConstants } from '../_constants'
import { appService } from '../_services'
import { alertActions } from './'

// export actions
export const appActions = {
    getAll,
}

/**
 * Get all apps
 * @return {Function} get all async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        appService.getAll()
        .then(apps => {
            dispatch(success(apps))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: appConstants.GETALL_REQUEST } }
    function success(apps) { return { type: appConstants.GETALL_SUCCESS, apps } }
    function failure(error) { return { type: appConstants.GETALL_FAILURE, error } }
}
