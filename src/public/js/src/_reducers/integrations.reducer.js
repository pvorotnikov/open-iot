import { integrationConstants } from '../_constants'

/**
 * Modules reducer
 * {
 *   ...
 *   integrations: { items: [{...}], loading: true}
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function integrations(state = { items: [], loading: false, }, action) {

    switch (action.type) {

        case integrationConstants.GETALL_REQUEST:
            return { ...state, loading: true, }

        case integrationConstants.GETALL_SUCCESS:
            return { ...state, items: action.integrations, loading: false, }

        case integrationConstants.GETALL_FAILURE:
            return { ...state, loading: false, }

        case integrationConstants.CREATE_REQUEST:
            return { ...state, loading: true, }

        case integrationConstants.CREATE_SUCCESS:
            return { ...state, items: [...state.items, action.integration], loading: false, }

        case integrationConstants.CREATE_FAILURE:
            return { ...state, loading: false, }

        case integrationConstants.DELETE_REQUEST:
            return { ...state, loading: true, }

        case integrationConstants.DELETE_SUCCESS:
            return { ...state, items: state.items.filter(i => i.id !== action.id), loading: false, }

        case integrationConstants.DELETE_FAILURE:
            return { ...state, loading: false, }

        case integrationConstants.SET_STATUS_REQUEST:
            return { ...state, loading: true, }

        case integrationConstants.SET_STATUS_SUCCESS:
            return { ...state, items: state.items.map(i => (
                i.id !== action.integration.id ? i : action.integration
            )), loading: false, }

        case integrationConstants.SET_STATUS_FAILURE:
            return { ...state, loading: false, }

        default:
            return state
    }

}
