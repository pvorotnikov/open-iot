import { pluginConstants } from '../_constants'
import { pluginService } from '../_services'
import { alertActions } from './'

// export actions
export const pluginActions = {
    getAll,
}

/**
 * Get all plugins
 * @return {Function} get all async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        pluginService.getAll()
        .then(plugins => {
            dispatch(success(plugins))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: pluginConstants.GETALL_REQUEST } }
    function success(plugins) { return { type: pluginConstants.GETALL_SUCCESS, plugins } }
    function failure(error) { return { type: pluginConstants.GETALL_FAILURE, error } }
}
