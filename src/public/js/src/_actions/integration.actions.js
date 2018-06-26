import { integrationConstants } from '../_constants'
import { integrationService } from '../_services'
import { alertActions } from './'

// export actions
export const integrationActions = {
    getAll,
    create,
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
