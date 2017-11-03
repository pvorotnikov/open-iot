import { userConstants } from '../constants'

/**
 * Registration reducer
 * {
 *   ...
 *   registration: { registering: true }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function registration(state = {}, action) {

    switch (action.type) {

        case userConstants.REGISTER_REQUEST:
            return {
                registering: true,
            }
            break

        case userConstants.REGISTER_SUCCESS:
            return {}
            break

        case userConstants.REGISTER_FAILURE:
            return {}
            break

        default:
            return state
    }

}
