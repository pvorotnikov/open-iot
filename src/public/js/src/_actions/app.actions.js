import { appConstants } from '../_constants'
import { appService } from '../_services'
import { history } from '../_helpers'
import { alertActions } from './'

// export actions
export const appActions = {
    getAll,
    create,
    getSingle,
    update,
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

/**
 * Get single app  by id
 * @param {String} id application id
 * @return {Function} get all async action
 */
function getSingle(id) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        appService.getById(id)
        .then(app => {
            dispatch(success(app))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: appConstants.GET_SINGLE_REQUEST } }
    function success(app) { return { type: appConstants.GET_SINGLE_SUCCESS, app } }
    function failure(error) { return { type: appConstants.GET_SINGLE_FAILURE, error } }
}

/**
 * Update application by id
 * @param  {String} id  application id
 * @param  {Object} app application update
 * @return {Function} update async action
 */
function update(id, app) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        appService.update(id, app)
        .then(() => {
            dispatch(success(id, app))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: appConstants.UPDATE_REQUEST } }
    function success(id, app) { return { type: appConstants.UPDATE_SUCCESS, id, app } }
    function failure(error) { return { type: appConstants.UPDATE_FAILURE, error } }
}
