import { integrationConstants } from '../_constants'
import { integrationService } from '../_services'
import { alertActions } from './'

// export actions
export const integrationActions = {
    getAll,
    create,
    delete: _delete,
    setStatus,
    setStepStatus,
}

/**
 * Get all integrations
 * @return {Function} get all async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        integrationService.getAll()
        .then(integrations => {
            dispatch(success(integrations))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: integrationConstants.GETALL_REQUEST } }
    function success(integrations) { return { type: integrationConstants.GETALL_SUCCESS, integrations } }
    function failure(error) { return { type: integrationConstants.GETALL_FAILURE, error } }
}


/**
 * Create new integration
 * @return {Function} create async action
 */
function create(topic, pipeline = []) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        integrationService.create(topic, pipeline)
        .then(integration => {
            dispatch(success(integration))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: integrationConstants.CREATE_REQUEST } }
    function success(integration) { return { type: integrationConstants.CREATE_SUCCESS, integration } }
    function failure(error) { return { type: integrationConstants.CREATE_FAILURE, error } }
}

/**
 * Delete integration
 * @return {Function} delete async action
 */
function _delete(id) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        integrationService.delete(id)
        .then(() => {
            dispatch(success(id))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: integrationConstants.DELETE_REQUEST } }
    function success(id) { return { type: integrationConstants.DELETE_SUCCESS, id } }
    function failure(error) { return { type: integrationConstants.DELETE_FAILURE, error } }
}

/**
 * Set integration status
 * @return {Function} set status async action
 */
function setStatus(integrationId, status) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        integrationService.setStatus(integrationId, status)
        .then(integration => {
            dispatch(success(integration))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: integrationConstants.SET_STATUS_REQUEST } }
    function success(integration) { return { type: integrationConstants.SET_STATUS_SUCCESS, integration } }
    function failure(error) { return { type: integrationConstants.SET_STATUS_FAILURE, error } }
}

/**
 * Set integration step status
 * @return {Function} set status async action
 */
function setStepStatus(integrationId, stepIndex, status) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        integrationService.setStepStatus(integrationId, stepIndex, status)
        .then(integration => {
            dispatch(success(integration))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: integrationConstants.SET_STEP_STATUS_REQUEST } }
    function success(integration) { return { type: integrationConstants.SET_STEP_STATUS_SUCCESS, integration } }
    function failure(error) { return { type: integrationConstants.SET_STEP_STATUS_FAILURE, error } }
}
