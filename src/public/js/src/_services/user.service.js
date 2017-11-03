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

function login(username, password) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify({ username, password }),
    }

    return fetch('/users/authenticate', requestOptions)
    .then(handleResponse)
    .then((user) => {
        if (user && user.token) {
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
    return fetch('/users', requestOptions)
    .then(handleResponse)
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    }
    return fetch('/users/' + id, requestOptions)
    .then(handleResponse)
}

function register(user) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify(user)
    }
    return fetch('/users/register', requestOptions)
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

function handleResponse(response) {
    if (!response.ok) {
        return Promise.reject(response.statusText)
    }
    return response.json()
}
