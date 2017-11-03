import { userConstants } from '../constants'

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
export function users(state = {}, action) {

    switch (action.type) {

        case userConstants.GETALL_REQUEST:
            return {
                loading: true,
            }
            break

        case userConstants.GETALL_SUCCESS:
            return {
                items: action.users,
            }
            break

        case userConstants.GETALL_FAILURE:
            return {
                error: action.error
            }
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
                items: state.items.filter(user => user.id !== action.id)
            }
            break

        case userConstants.DELETE_FAILURE:
            // remove the deleting:true flag and add error
            return {
                ...state,
                items: state.items.map(user => {

                    if (user.id === action.id) {
                        // copy user
                        const { deleting, ...userCopy } = user
                        // return the copied user with delete error
                        return { ...userCopy, deleteError: action.error }
                    }

                    return user

                })
            }
            break

        default:
            return state
    }

}
