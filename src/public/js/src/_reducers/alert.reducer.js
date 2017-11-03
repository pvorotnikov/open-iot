import { alertConstants } from '../_constants'

/**
 * Alert reducer
 * {
 *   ...
 *   alert: { type: 'alert-success', message: 'Success' }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function alert(state = {}, action) {

    switch (action.type) {

        case alertConstants.SUCCESS:
            return {
                type: 'success',
                message: action.message,
            }
            break

        case alertConstants.ERROR:
            return {
                type: 'error',
                message: action.message,
            }
            break

        case alertConstants.CLEAR:
            return {}
            break

        default:
            return state
    }

}
