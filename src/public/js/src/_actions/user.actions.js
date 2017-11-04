import { userConstants } from '../_constants'
import { userService } from '../_services'
import { alertActions } from './'
import { history } from '../_helpers'

// export actions
export const userActions = {
    login,
    logout,
    register,
    getAll,
    delete: _delete,
}

/**
 * Attempt login
 * @param  {String} email
 * @param  {String} password
 * @return {Function} login async action
 */
function login(email, password) {
    return dispatch => {
        dispatch(request({ email }))

        // perform async operation
        userService.login(email, password)
        .then(user => {
            dispatch(success(user))
            history.push('/')
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request(user) { return { type: userConstants.LOGIN_REQUEST, user } }
    function success(user) { return { type: userConstants.LOGIN_SUCCESS, user } }
    function failure(error) { return { type: userConstants.LOGIN_FAILURE, error } }
}

/**
 * Log out current user
 * @return {Object} logout action
 */
function logout() {
    userService.logout()
    history.push('/')
    return { type: userConstants.LOGOUT }
}

/**
 * Register new user
 * @param  {Object} user user object
 * @return {Function} register async action
 */
function register(user) {
    return dispatch => {
        dispatch(request(user))

        // perform async operation
        userService.register(user)
        .then(
            user => {
                dispatch(success())
                history.push('/login')
                dispatch(alertActions.success('Registration successful'))
            },
            // TODO: move this to catch
            error => {
                dispatch(failure(error))
                dispatch(alertActions.error(error))
            }
        )
    }

    function request(user) { return { type: userConstants.REGISTER_REQUEST, user } }
    function success(user) { return { type: userConstants.REGISTER_SUCCESS, user } }
    function failure(error) { return { type: userConstants.REGISTER_FAILURE, error } }
}

/**
 * Get all users
 * @return {Function} get all async action
 */
function getAll() {
    return dispatch => {
        dispatch(request())

        // perform async operation
        userService.getAll()
        .then(
            users => dispatch(success(users)),
            // TODO: move this to catch
            error => {
                dispatch(failure(error))
                dispatch(alertActions.error(error))
            }
        )
    }

    function request() { return { type: userConstants.GETALL_REQUEST } }
    function success(users) { return { type: userConstants.GETALL_SUCCESS, users } }
    function failure(error) { return { type: userConstants.GETALL_FAILURE, error } }
}

/**
 * Delete user.
 * Prefixed function name with underscore because
 * delete is a reserved word in js
 * @param  {Number} id user id
 * @return {Function} delete async action
 */
function _delete(id) {
    return dispatch => {
        dispatch(request(id))

        // perform async operation
        userService.delete(id)
        .then(
            user => {
                dispatch(success(id))
            },
            // TODO: move this to catch
            error => {
                dispatch(failure(id, error))
            }
        )
    }

    function request(id) { return { type: userConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: userConstants.DELETE_SUCCESS, id } }
    function failure(id, error) { return { type: userConstants.DELETE_FAILURE, id, error } }
}
