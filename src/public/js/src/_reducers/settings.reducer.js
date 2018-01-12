import { settingConstants } from '../_constants'

/**
 * Settings reducer
 * {
 *   ...
 *   settings: { items: [{...}], loading: true}
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function settings(state = { items: null, loading: false, }, action) {

    switch (action.type) {

        case settingConstants.GETALL_REQUEST:
            return { ...state, loading: true, }
            break

        case settingConstants.GETALL_SUCCESS:
            return { ...state, items: action.settings, loading: false, }
            break

        case settingConstants.GETALL_FAILURE:
            return { ...state, items: null, loading: false, }
            break

        default:
            return state
    }

}
