import { tagConstants } from '../_constants'

/**
 * Tags reducer
 * {
 *   ...
 *   tags: { items: [{...}], loading: true, error: 'Error' }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function tags(state = { items: [], loading: false, error: null, }, action) {

    switch (action.type) {

        // =================================

        case tagConstants.GETALL_REQUEST:
            return { ...state, items: [], loading: true, }
            break

        case tagConstants.GETALL_SUCCESS:
            return { ...state, items: action.tags, loading: false, }
            break

        case tagConstants.GETALL_FAILURE:
            return { ...state, items: [], loading: false, }
            break

        // =================================

        case tagConstants.CREATE_REQUEST:
            return { ...state, loading: true, }
            break

        case tagConstants.CREATE_SUCCESS:
            return { ...state, items: [...state.items, action.tag], loading: false, }
            break

        case tagConstants.CREATE_FAILURE:
            return { ...state, loading: false, }
            break

        // =================================

        case tagConstants.DELETE_REQUEST:
            return { ...state, loading: true, }
            break

        case tagConstants.DELETE_SUCCESS:
            return { ...state, items: state.items.filter(t => t.id !== action.id), loading: false, }
            break

        case tagConstants.DELETE_FAILURE:
            return { ...state, loading: false, }
            break

        // =================================

        default:
            return state
    }

}
