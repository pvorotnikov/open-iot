import { cronConstants } from '../_constants'

/**
 * Crons reducer
 * {
 *   ...
 *   crons: { items: [{...}], loading: true }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function crons(state = {items: [], loading: false}, action) {

    switch (action.type) {

        case cronConstants.GETALL_REQUEST:
            return { ...state, items: [], loading: true, }
            break

        case cronConstants.GETALL_SUCCESS:
            return { ...state, items: action.crons, loading: false, }
            break

        case cronConstants.GETALL_FAILURE:
            return { ...state, items: [], loading: false, }
            break

        case cronConstants.CREATE_REQUEST:
            return { ...state, loading: true, }
            break

        case cronConstants.CREATE_SUCCESS:
            return { ...state, items: [...state.items, action.cron], loading: false }
            break

        case cronConstants.CREATE_FAILURE:
            return { ...state, loading: false, }
            break

        case cronConstants.UPDATE_REQUEST:
            return { ...state, loading: true, }
            break

        case cronConstants.UPDATE_SUCCESS:
            return {
                ...state,
                items: state.items.map(cron =>
                    cron.id === action.cron.id
                        ? action.cron
                        : cron
                ),
                loading: false,
            }
            break

        case cronConstants.UPDATE_FAILURE:
            return { ...state, loading: false, }
            break

        case cronConstants.DELETE_REQUEST:
            return { ...state, loading: true, }
            break

        case cronConstants.DELETE_SUCCESS:
            return {
                ...state,
                items: state.items.filter(cron => cron.id !== action.id),
                loading: false,
            }
            break

        case cronConstants.DELETE_FAILURE:
            return { ...state, loading: false, }
            break

        default:
            return state
    }

}
