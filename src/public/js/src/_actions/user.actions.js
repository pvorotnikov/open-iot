import { userConstants } from '../_constants'
import { userService } from '../_services'
import { alertActions } from './'

// export actions
export const userActions = {
    login,
    logout,
    register,
    getAll,
    delete: _delete,
    update,
    refreshKey,
    refreshSecret,
}

/**
 * Attempt login
 * @param  {String} email
 * @param  {String} password
 * @return {Function} login async action
 */
function login(email, password, history) {
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
function logout(history) {
    userService.logout()
    history.push('/login')
    return { type: userConstants.LOGOUT }
}

/**
 * Register new user
 * @param  {Object} user user object
 * @return {Function} register async action
 */
function register(user, history) {
    return dispatch => {
        dispatch(request(user))

        // perform async operation
        userService.register(user)
        .then(user => {
            dispatch(success())
            history.push('/login')
            dispatch(alertActions.success('Registration successful'))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
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
        .then(users => {
            dispatch(success(users))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
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
        .then(() => {
            dispatch(success(id))
            dispatch(alertActions.success('User deleted'))
        })
        .catch(error => {
            dispatch(failure(id, error))
            dispatch(alertActions.error(error))
        })
    }

    function request(id) { return { type: userConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: userConstants.DELETE_SUCCESS, id } }
    function failure(id, error) { return { type: userConstants.DELETE_FAILURE, id, error } }
}

function update(id, user) {
    return dispatch => {
        dispatch(request(id))

        // perform async operation
        userService.update(id, user)
        .then(() => {
            dispatch(success(id, user))
            dispatch(alertActions.success('User updated'))
        })
        .catch(error => {
            dispatch(failure(id, error))
            dispatch(alertActions.error(error))
        })
    }

    function request(id) { return { type: userConstants.UPDATE_REQUEST, id } }
    function success(id, user) { return { type: userConstants.UPDATE_SUCCESS, id, user } }
    function failure(id, error) { return { type: userConstants.UPDATE_FAILURE, id, error } }
}

/**
 * Refresh user key
 * @param  {String} id  user id
 * @return {Function} update async action
 */
function refreshKey(id) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        userService.refreshKey(id)
        .then((data) => {
            dispatch(success(id, data.key))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: userConstants.REFRESH_KEY_REQUEST } }
    function success(id, key) { return { type: userConstants.REFRESH_KEY_SUCCESS, id, key } }
    function failure(error) { return { type: userConstants.REFRESH_KEY_FAILURE, error } }
}

/**
 * Refresh user secret
 * @param  {String} id user id
 * @return {Function} update async action
 */
function refreshSecret(id) {
    return dispatch => {
        dispatch(request())

        // perform async operation
        userService.refreshSecret(id)
        .then((data) => {
            dispatch(success(id, data.secret))
        })
        .catch(error => {
            dispatch(failure(error))
            dispatch(alertActions.error(error))
        })
    }

    function request() { return { type: userConstants.REFRESH_SECRET_REQUEST } }
    function success(id, secret) { return { type: userConstants.REFRESH_SECRET_SUCCESS, id, secret } }
    function failure(error) { return { type: userConstants.REFRESH_SECRET_FAILURE, error } }
}
