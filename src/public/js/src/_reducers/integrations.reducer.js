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
            // TODO
            return { ...state, items: [...state.items, action.integration], loading: false, }

        case integrationConstants.CREATE_FAILURE:
            return { ...state, loading: false, }

        default:
            return state
    }

}
