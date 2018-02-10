import { userConstants } from '../_constants'

/**
 * Users reducer
 * {
 *   ...
 *   users: { items: [{...}], loading: true, error: 'Error' }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function users(state = { items: [], loading: false, }, action) {

    switch (action.type) {

        case userConstants.GETALL_REQUEST:
            return { ...state, loading: true, }
            break

        case userConstants.GETALL_SUCCESS:
            return { ...state, items: action.users, loading: false, }
            break

        case userConstants.GETALL_FAILURE:
            return { ...state, loading: false, }
            break

        case userConstants.DELETE_REQUEST:
            // mark the user as being deleted
            return {
                ...state,
                items: state.items.map(user =>
                    user.id === action.id
                        ? { ...user, deleting: true }
                        : user
                )
            }
            break

        case userConstants.DELETE_SUCCESS:
            // remove the user
            return {
                ...state,
                items: state.items.filter(user => user.id !== action.id)
            }
            break

        case userConstants.DELETE_FAILURE:
            // remove the deleting:true flag and add error
            return {
                ...state,
                items: state.items.map(user => {

                    if (user.id === action.id) {
                        // copy user (without the deleting flag)
                        const { deleting, ...userCopy } = user
                        // return the copied user with delete error
                        return { ...userCopy, deleteError: action.error }
                    }

                    return user

                })
            }
            break

        case userConstants.UPDATE_REQUEST:
            // mark the user as being updated
            return {
                ...state,
                items: state.items.map(user =>
                    user.id === action.id
                        ? { ...user, updating: true }
                        : user
                )
            }
            break

        case userConstants.UPDATE_SUCCESS:
            // update the values of the user
            return {
                ...state,
                items: state.items.map(user => {
                    if (user.id === action.id) {
                        // copy user without the updating flag
                        const { updating, ...userCopy } = user
                        const { firstName, lastName, email } = action.user
                        // return the copied user with the new values
                        return { ...userCopy, email, firstName, lastName }
                    }
                })
            }
            break

        case userConstants.UPDATE_FAILURE:
            // remove the updating:true flag and add error
            return {
                ...state,
                items: state.items.map(user => {
                    if (user.id === action.id) {
                        // copy user (without the updating flag)
                        const { updating, ...userCopy } = user
                        // return the copied user with update error
                        return { ...userCopy, updateError: action.error }
                    }
                    return user
                })
            }
            break

        case userConstants.REFRESH_KEY_REQUEST:
            // mark the user as being updated
            return {
                ...state,
                items: state.items.map(user =>
                    user.id === action.id
                        ? { ...user, updating: true }
                        : user
                )
            }
            break

        case userConstants.REFRESH_KEY_SUCCESS:
            // update the key of the user
            return {
                ...state,
                items: state.items.map(user => {
                    if (user.id === action.id) {
                        const { updating, ...userCopy } = user
                        return { ...userCopy, key: action.key }
                    }
                    return user
                })
            }
            break

        case userConstants.REFRESH_KEY_FAILURE:
            return {
                ...state,
                items: state.items.map(user => {
                    if (user.id === action.id) {
                        const { updating, ...userCopy } = user
                        return userCopy
                    }
                    return user
                })
            }
            break

        case userConstants.REFRESH_SECRET_REQUEST:
            // mark the user as being updated
            return {
                ...state,
                items: state.items.map(user =>
                    user.id === action.id
                        ? { ...user, updating: true }
                        : user
                )
            }
            break

        case userConstants.REFRESH_SECRET_SUCCESS:
            // update the secret of the user
            return {
                ...state,
                items: state.items.map(user => {
                    if (user.id === action.id) {
                        const { updating, ...userCopy } = user
                        return { ...userCopy, secret: action.secret }
                    }
                    return user
                })
            }
            break

        case userConstants.REFRESH_SECRET_FAILURE:
            return {
                ...state,
                items: state.items.map(user => {
                    if (user.id === action.id) {
                        const { updating, ...userCopy } = user
                        return userCopy
                    }
                    return user
                })
            }
            break

        default:
            return state
    }

}
