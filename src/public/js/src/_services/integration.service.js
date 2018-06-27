import { authHeader, jsonHeader } from '../_helpers'
import { Request } from '../_helpers'

export const integrationService = {
    getAll,
    create,
    delete: _delete,
    setStatus,
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

function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
    }
    return new Request().send('/api/integrations/' + id, requestOptions)
}

function setStatus(integrationId, status) {
    const requestOptions = {
        method: 'PUT',
        headers: jsonHeader(),
        body: JSON.stringify({ status })
    }
    return new Request().send('/api/integrations/' + integrationId, requestOptions)
}
