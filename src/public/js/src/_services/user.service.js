import { authHeader, jsonHeader } from '../_helpers'

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
}

function register(user) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify(user)
    }
    return fetch('/api/passport/register', requestOptions)
    .then(handleResponse)
}

function login(email, password) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify({ email, password }),
    }

    return fetch('/api/passport/auth', requestOptions)
    .then(handleResponse)
    .then((user) => {
        if (user && user.accessToken && user.refreshToken) {
            localStorage.setItem('user', JSON.stringify(user))
        }
        return user
    })
}

function logout() {
    localStorage.removeItem('user')
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    }
    return fetch('/api/users', requestOptions)
    .then(handleResponse)
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    }
    return fetch('/api/users/' + id, requestOptions)
    .then(handleResponse)
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), ...jsonHeader() },
        body: JSON.stringify(user)
    }
    return fetch('/users/' + user.id, requestOptions)
    .then(handleResponse)
}

function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    }
    return fetch('/users/' + id, requestOptions)
    .then(handleResponse)
}

/**
 * Generic handler for API protocol
 * { status: 'ok', data: {...}|[...] }
 * { status: 'error', errorMessage='...', data: {...}|[...] }
 * @param  {Response} response
 * @return {Promise}
 */
function handleResponse(response) {
    return new Promise((fulfill, reject) => {
        if (!response.ok) {
            response.json()
            .then((res) => {
                reject(res.errorMessage || response.statusText)
            })
            .catch((err) => {
                reject(err.message)
            })
        } else {
            response.json()
            .then((res) => {
                fulfill(res.data)
            })
            .catch((err) => {
                reject(err.message)
            })
        }
    })
}
