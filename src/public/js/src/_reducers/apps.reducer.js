import { appConstants } from '../_constants'

/**
 * Apps reducer
 * {
 *   ...
 *   apps: { items: [{...}], loading: true, error: 'Error' }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function apps(state = {}, action) {

    switch (action.type) {

        case appConstants.CLEAR:
            return {}
            break

        case appConstants.CREATE_REQUEST:
            return { loading: true, }
            break

        case appConstants.CREATE_SUCCESS:
            return {}
            break

        case appConstants.CREATE_FAILURE:
            return {}
            break

        case appConstants.GETALL_REQUEST:
            return { loading: true, }
            break

        case appConstants.GETALL_SUCCESS:
            return { items: action.apps, }
            break

        case appConstants.GETALL_FAILURE:
            return { error: action.error, }
            break

        case appConstants.DELETE_REQUEST:
            return { ...state, loading: true, }
            break

        case appConstants.DELETE_SUCCESS:
            return {}
            break

        case appConstants.DELETE_FAILURE:
            return { ...state, loading: false, }
            break

        case appConstants.GET_SINGLE_REQUEST:
            return { loading: true, }
            break

        case appConstants.GET_SINGLE_SUCCESS:
            return { app: action.app, }
            break

        case appConstants.GET_SINGLE_FAILURE:
            return { error: action.error }
            break

        case appConstants.UPDATE_REQUEST:
            return { ...state, loading: true, }
            break

        case appConstants.UPDATE_SUCCESS:
            return { app: { ...state.app, ...action.app, } }
            break

        case appConstants.UPDATE_FAILURE:
            return { ...state, error: action.error }
            break

        case appConstants.REFRESH_KEY_REQUEST:
            return { ...state, loading: true, }
            break

        case appConstants.REFRESH_KEY_SUCCESS:
            return { app: { ...state.app, key: action.key, } }
            break

        case appConstants.REFRESH_KEY_FAILURE:
            return { ...state, error: action.error }
            break

        case appConstants.REFRESH_SECRET_REQUEST:
            return { ...state, loading: true, }
            break

        case appConstants.REFRESH_SECRET_SUCCESS:
            return { app: { ...state.app, secret: action.secret, } }
            break

        case appConstants.REFRESH_SECRET_FAILURE:
            return { ...state, error: action.error }
            break

        default:
            return state
    }

}
