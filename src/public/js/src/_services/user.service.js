import { authHeader, jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    refreshKey,
    refreshSecret,
}

/**
 * Register a new user request
 * @return {Promise} response promise
 */
function register(user) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify(user)
    }
    return new Request().send('/api/passport/register', requestOptions)
}

/**
 * Authenticate user by email and password
 * @param {String} email user email
 * @param {String} password user password
 * @return {Promise} response promise
 */
function login(email, password) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify({ email, password }),
    }

    return new Request().send('/api/passport/auth', requestOptions)
    .then(user => {
        if (user && user.accessToken && user.refreshToken) {
            localStorage.setItem('user', JSON.stringify(user))
        }
        return user
    })
}

/**
 * Log out the user
 */
function logout() {
    localStorage.removeItem('user')
}

/**
 * Get all users request
 * @return {Promise} response promise
 */
function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/users', requestOptions)
}

/**
 * Get a single user by id
 * @param  {String} id user id
 * @return {Promise} response promise
 */
function getById(id) {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/users/' + id, requestOptions)
}

/**
 * Update user
 * @param  {String} id user id
 * @param  {Object} user user update
 * @return {Promise} response promise
 */
function update(id, user) {
    const requestOptions = {
        method: 'PUT',
        headers: jsonHeader(),
        body: JSON.stringify(user)
    }
    return new Request().send('/api/users/' + id, requestOptions)
}

/**
 * Delete user
 * @param  {String} id user id
 * @return {Promise} response promise
 */
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
    }
    return new Request().send('/api/users/' + id, requestOptions)
}

/**
 * Refresh user key used for API interaction
 * @param  {String} id user id
 * @return {Promise} response promise
 */
function refreshKey(id) {
    const requestOptions = {
        method: 'PUT',
    }
    return new Request().send('/api/users/' + id + '/key', requestOptions)
}

/**
 * Refresh user secret used for API interaction
 * @param  {String} id user id
 * @return {Promise} response promise
 */
function refreshSecret(id) {
    const requestOptions = {
        method: 'PUT',
    }
    return new Request().send('/api/users/' + id + '/secret', requestOptions)
}
