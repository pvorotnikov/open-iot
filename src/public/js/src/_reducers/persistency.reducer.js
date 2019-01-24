import { persistencyConstants } from '../_constants'

/**
 * Persistency reducer
 * {
 *   ...
 *   persistency: { items: [{...}], loading: true}
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function persistency(state = { items: [], loading: false, }, action) {

    switch (action.type) {

        case persistencyConstants.GET_REQUEST:
            return { ...state, loading: true, }

        case persistencyConstants.GET_SUCCESS:
            return { ...state, items: action.messages, loading: false, }

        case persistencyConstants.GET_FAILURE:
            return { ...state, items: [], loading: false, }

        default:
            return state
    }

}
