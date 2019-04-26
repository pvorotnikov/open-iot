import { cronConstants } from '../_constants'
import { cronService } from '../_services'
import { alertActions } from './'

// export actions
export const cronActions = {
    getAll,
    create,
    update,
    delete: _delete,
}

/**
 * Get all crons
 * @return {Function} get crons async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        cronService.getAll()
        .then(crons => {
            dispatch(success(crons))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: cronConstants.GETALL_REQUEST } }
    function success(crons) { return { type: cronConstants.GETALL_SUCCESS, crons } }
    function failure(error) { return { type: cronConstants.GETALL_FAILURE, error } }
}

/**
 * Create a new cron
 * @param {Object} cron cron definition
 * @return {Function} create async action
 */
function create(cron) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        cronService.create(cron)
        .then(cron => {
            dispatch(success(cron))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: cronConstants.CREATE_REQUEST } }
    function success(cron) { return { type: cronConstants.CREATE_SUCCESS, cron } }
    function failure(error) { return { type: cronConstants.CREATE_FAILURE, error } }
}

/**
 * Update cron by id
 * @param  {String} id cron id
 * @param  {Object} cron cron update
 * @return {Function} update async action
 */
function update(id, cron) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        cronService.update(id, cron)
        .then((cron) => {
            dispatch(success(cron))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: cronConstants.UPDATE_REQUEST } }
    function success(cron) { return { type: cronConstants.UPDATE_SUCCESS, cron } }
    function failure(error) { return { type: cronConstants.UPDATE_FAILURE, error } }
}

/**
 * Delete cron
 * @param {Object} id cron id
 * @return {Function} delete async action
 */
function _delete(id) {
    return dispatch => {
        dispatch(request(id))

        // perform async operation
        cronService.delete(id)
        .then(() => {
            dispatch(success(id))
        })
        .catch(error => {
            dispatch(failure(id, error))
            dispatch(alertActions.error(error))
        })
    }

    function request(id) { return { type: cronConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: cronConstants.DELETE_SUCCESS, id } }
    function failure(error) { return { type: cronConstants.DELETE_FAILURE, id, error } }
}
