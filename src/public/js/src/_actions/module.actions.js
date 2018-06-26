import { moduleConstants } from '../_constants'
import { moduleService } from '../_services'
import { alertActions } from './'

// export actions
export const moduleActions = {
    getAll,
    setStatus,
}

/**
 * Get all modules
 * @return {Function} get all async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        moduleService.getAll()
        .then(modules => {
            dispatch(success(modules))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: moduleConstants.GETALL_REQUEST } }
    function success(modules) { return { type: moduleConstants.GETALL_SUCCESS, modules } }
    function failure(error) { return { type: moduleConstants.GETALL_FAILURE, error } }
}

/**
 * Set module status
 * @return {Function} set status async action
 */
function setStatus(moduleId, status) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        moduleService.setStatus(moduleId, status)
        .then(updatedModule => {
            dispatch(success(updatedModule))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: moduleConstants.SET_STATUS_REQUEST } }
    function success(updatedModule) { return { type: moduleConstants.SET_STATUS_SUCCESS, updatedModule } }
    function failure(error) { return { type: moduleConstants.SET_STATUS_FAILURE, error } }
}
