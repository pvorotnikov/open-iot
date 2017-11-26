import { scopeConstants } from '../_constants'

/**
 * Scopes reducer
 * {
 *   ...
 *   scopes: { items: [{...}], loading: true, error: 'Error' }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function scopes(state = {items: [], loading: false}, action) {

    switch (action.type) {

        case scopeConstants.CLEAR:
            return {}
            break

        case scopeConstants.GETALL_REQUEST:
            return { ...state, loading: true, }
            break

        case scopeConstants.GETALL_SUCCESS:
            return { ...state, items: action.scopes, loading: false }
            break

        case scopeConstants.GETALL_FAILURE:
            return { ...state, loading: false }
            break

        default:
            return state
    }

}
