import { gatewayConstants } from '../_constants'
import { gatewayService } from '../_services'
import { history } from '../_helpers'
import { alertActions } from './'

// export actions
export const gatewayActions = {
    clear,
    getAll,
    create,
    delete: _delete,
}

function clear() {
    return { type: gatewayConstants.CLEAR }
}

/**
 * Get all gateways associated with an application
 * @param  {String} id application id
 * @return {Function} get gateways async action
 */
function getAll(id) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        gatewayService.getAll(id)
        .then(gateways => {
            dispatch(success(gateways))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: gatewayConstants.GETALL_REQUEST } }
    function success(gateways) { return { type: gatewayConstants.GETALL_SUCCESS, gateways } }
    function failure(error) { return { type: gatewayConstants.GETALL_FAILURE, error } }
}

/**
 * Create a new gateway
 * @param {Object} gateway gateway definition
 * @return {Function} create async action
 */
function create(gateway) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        gatewayService.create(gateway)
        .then(gateway => {
            dispatch(success(gateway))
            history.goBack()
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: gatewayConstants.CREATE_REQUEST } }
    function success(gateway) { return { type: gatewayConstants.CREATE_SUCCESS, gateway } }
    function failure(error) { return { type: gatewayConstants.CREATE_FAILURE, error } }
}

/**
 * Delete gateway
 * @param {Object} id gateway id
 * @return {Function} delete async action
 */
function _delete(id) {
    return dispatch => {
        dispatch(request(id))

        // perform async operation
        gatewayService.delete(id)
        .then(() => {
            dispatch(success(id))
        })
        .catch(error => {
            dispatch(failure(id, error))
            dispatch(alertActions.error(error))
        })
    }

    function request(id) { return { type: gatewayConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: gatewayConstants.DELETE_SUCCESS, id } }
    function failure(error) { return { type: gatewayConstants.DELETE_FAILURE, id, error } }
}
