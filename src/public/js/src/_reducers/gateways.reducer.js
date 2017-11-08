import { gatewayConstants } from '../_constants'

/**
 * Gateways reducer
 * {
 *   ...
 *   gateways: { items: [{...}], loading: true, error: 'Error' }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function gateways(state = {}, action) {

    switch (action.type) {

        case gatewayConstants.GETALL_REQUEST:
            return { loading: true, }
            break

        case gatewayConstants.GETALL_SUCCESS:
            return { items: action.gateways, }
            break

        case gatewayConstants.GETALL_FAILURE:
            return { error: action.error, }
            break

        default:
            return state
    }

}
