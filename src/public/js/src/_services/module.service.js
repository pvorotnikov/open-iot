import { authHeader, jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const moduleService = {
    getAll,
    setStatus,
}

function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/modules', requestOptions)
}

function setStatus(moduleId, status) {
    const requestOptions = {
        method: 'PUT',
        headers: jsonHeader(),
        body: JSON.stringify({ status })
    }
    return new Request().send('/api/modules/' + moduleId, requestOptions)
}
