import { gatewayConstants } from '../_constants'
import { gatewayService } from '../_services'
import { history } from '../_helpers'
import { alertActions } from './'

// export actions
export const gatewayActions = {
    getAll,
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
