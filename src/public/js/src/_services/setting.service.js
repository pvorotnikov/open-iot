import { authHeader, jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const settingService = {
    getAll,
    update,
    getEnableRegistrations,
}

function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/settings', requestOptions)
}

function update(key, value) {
    const requestOptions = {
        method: 'PUT',
        headers: jsonHeader(),
        body: JSON.stringify({ value })
    }
    return new Request().send('/api/settings/' + key, requestOptions)
}

function getEnableRegistrations() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/settings/global.enableregistrations', requestOptions)
}
