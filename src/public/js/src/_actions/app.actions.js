import { appConstants } from '../_constants'
import { appService } from '../_services'
import { history } from '../_helpers'
import { alertActions } from './'

// export actions
export const appActions = {
    getAll,
    create,
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

/**
 * Create a new application
 * @param {Object} app app definition
 * @return {Function} create async action
 */
function create(app) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        appService.create(app)
        .then(app => {
            dispatch(success(app))
            history.goBack()
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: appConstants.CREATE_REQUEST } }
    function success(app) { return { type: appConstants.CREATE_SUCCESS, app } }
    function failure(error) { return { type: appConstants.CREATE_FAILURE, error } }
}
