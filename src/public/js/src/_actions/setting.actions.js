import { settingConstants } from '../_constants'
import { settingService } from '../_services'
import { alertActions } from './'

// export actions
export const settingActions = {
    getAll,
    update,
    getEnableRegistrations,
}

/**
 * Get all settings
 * @return {Function} get all async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        settingService.getAll()
        .then(settings => {
            dispatch(success(settings))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: settingConstants.GETALL_REQUEST } }
    function success(settings) { return { type: settingConstants.GETALL_SUCCESS, settings } }
    function failure(error) { return { type: settingConstants.GETALL_FAILURE, error } }
}

/**
 * Update a setting
 * @return {Function} get all async action
 */
function update(key, value) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        settingService.update(key, value)
        .then(setting => {
            dispatch(success(setting))
            dispatch(alertActions.success(`Setting ${key} updated`))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: settingConstants.UPDATE_REQUEST } }
    function success(setting) { return { type: settingConstants.UPDATE_SUCCESS, setting } }
    function failure(error) { return { type: settingConstants.UPDATE_FAILURE, error } }
}

function getEnableRegistrations() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        settingService.getEnableRegistrations()
        .then(result => {
            dispatch(success(result.value))
        })
        .catch(error => {
            dispatch(failure(error))
        })
    }

    function request() { return { type: settingConstants.GET_ENABLE_REGISTRATIONS_REQUEST } }
    function success(setting) { return { type: settingConstants.GET_ENABLE_REGISTRATIONS_SUCCESS, setting } }
    function failure(error) { return { type: settingConstants.GET_ENABLE_REGISTRATIONS_FAILURE, error } }
}
