import { appConstants } from '../_constants'

/**
 * Apps reducer
 * {
 *   ...
 *   apps: { items: [{...}], loading: true, error: 'Error' }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function apps(state = {}, action) {

    switch (action.type) {

        case appConstants.GETALL_REQUEST:
            return {
                loading: true,
            }
            break

        case appConstants.GETALL_SUCCESS:
            return {
                items: action.apps,
            }
            break

        case appConstants.GETALL_FAILURE:
            return {
                error: action.error
            }
            break

        default:
            return state
    }

}
