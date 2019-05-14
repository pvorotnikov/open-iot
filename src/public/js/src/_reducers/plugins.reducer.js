import { pluginConstants } from '../_constants'

/**
 * Plugins reducer
 * {
 *   ...
 *   plugins: { items: [{...}], loading: true}
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function plugins(state = { items: [], loading: false, }, action) {

    switch (action.type) {

        case pluginConstants.GETALL_REQUEST:
            return { ...state, loading: true, }
            break

        case pluginConstants.GETALL_SUCCESS:
            return { ...state, items: action.plugins, loading: false, }
            break

        case pluginConstants.GETALL_FAILURE:
            return { ...state, loading: false, }
            break

        default:
            return state
    }

}
