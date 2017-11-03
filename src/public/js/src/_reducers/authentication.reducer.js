import { userConstants } from '../_constants'

let user = JSON.parse(localStorage.getItem('user'))
const initialState = user ? { loggedIn: true, user } : {}

/**
 * Authentication reducer
 * {
 *   ...
 *   authentication: { user: {...}, loggingIn: true, loggedIn: true }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function authentication(state = initialState, action) {

    switch (action.type) {

        case userConstants.LOGIN_REQUEST:
            return {
                loggingIn: true,
                user: action.user,
            }
            break

        case userConstants.LOGIN_SUCCESS:
            return {
                loggedIn: true,
                user: action.user,
            }
            break

        case userConstants.LOGIN_FAILURE:
            return {}
            break

        case userConstants.LOGOUT:
            return {}
            break

        default:
            return state
    }

}
