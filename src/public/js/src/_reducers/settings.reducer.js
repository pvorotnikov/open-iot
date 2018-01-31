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
export function settings(state = { items: null, loading: false, registrationEnabled: false, }, action) {

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

        case settingConstants.UPDATE_REQUEST:
            return { ...state, loading: true, }
            break

        case settingConstants.UPDATE_SUCCESS:
            // update the values of the user
            return {
                ...state,
                items: state.items.map(setting => (
                    setting.key === action.setting.key
                        ? action.setting
                        : setting
                )),
                loading: false
            }
            break

        case settingConstants.UPDATE_FAILURE:
            return { ...state, loading: false, }
            break

        case settingConstants.GET_ENABLE_REGISTRATIONS_REQUEST:
            return { ...state, loading: true, }
            break

        case settingConstants.GET_ENABLE_REGISTRATIONS_SUCCESS:
            return { ...state, loading: false, registrationEnabled: action.setting, }
            break

        case settingConstants.GET_ENABLE_REGISTRATIONS_FAILURE:
            return { ...state, loading: false, }
            break

        default:
            return state
    }

}
