import { authHeader, jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const integrationService = {
    getAll,
    create,
}

function getAll() {
    const requestOptions = {
        method: 'GET',
    }
    return new Request().send('/api/integrations', requestOptions)
}

function create(topic, pipeline) {
    const requestOptions = {
        method: 'POST',
        headers: jsonHeader(),
        body: JSON.stringify({ topic, pipeline })
    }
    return new Request().send('/api/integrations', requestOptions)
}
