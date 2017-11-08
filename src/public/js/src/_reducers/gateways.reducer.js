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

        case gatewayConstants.CREATE_REQUEST:
            return { loading: true, }
            break

        case gatewayConstants.CREATE_SUCCESS:
            return {}
            break

        case gatewayConstants.CREATE_FAILURE:
            return {}
            break

        case gatewayConstants.GETALL_REQUEST:
            return { loading: true, }
            break

        case gatewayConstants.GETALL_SUCCESS:
            return { items: action.gateways, }
            break

        case gatewayConstants.GETALL_FAILURE:
            return { error: action.error, }
            break

        case gatewayConstants.DELETE_REQUEST:
            // mark the gateway as being deleted
            return {
                ...state,
                items: state.items.map(gateway =>
                    gateway.id === action.id
                        ? { ...gateway, deleting: true }
                        : gateway
                )
            }
            break

        case gatewayConstants.DELETE_SUCCESS:
            // remove the gateway
            return {
                ...state,
                items: state.items.filter(gateway => gateway.id !== action.id)
            }
            break

        case gatewayConstants.DELETE_FAILURE:
            // remove the deleting:true flag and add error
            return {
                ...state,
                items: state.items.map(gateway => {
                    if (gateway.id === action.id) {
                        // copy gateway (without the deleting flag)
                        const { deleting, ...gatewayCopy } = gateway
                        // return the copied gateway with delete error
                        return { ...gatewayCopy, deleteError: action.error }
                    }
                    return gateway
                })
            }
            break

        default:
            return state
    }

}
