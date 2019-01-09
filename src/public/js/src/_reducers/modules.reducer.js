import { moduleConstants } from '../_constants'

/**
 * Modules reducer
 * {
 *   ...
 *   modules: { items: [{...}], loading: true}
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function modules(state = { items: [], loading: false, }, action) {

    switch (action.type) {

        case moduleConstants.GETALL_REQUEST:
            return { ...state, loading: true, }
            break

        case moduleConstants.GETALL_SUCCESS:
            return { ...state, items: action.modules, loading: false, }
            break

        case moduleConstants.GETALL_FAILURE:
            return { ...state, loading: false, }
            break

        case moduleConstants.SET_STATUS_REQUEST:
            return { ...state, loading: true, }
            break

        case moduleConstants.SET_STATUS_SUCCESS:
            // update the values of the user
            return {
                ...state,
                items: state.items.map(m => (
                    m.id === action.updatedModule.id
                        ? action.updatedModule
                        : m
                )),
                loading: false
            }
            break

        case moduleConstants.SET_STATUS_FAILURE:
            return { ...state, loading: false, }
            break

        default:
            return state
    }

}
