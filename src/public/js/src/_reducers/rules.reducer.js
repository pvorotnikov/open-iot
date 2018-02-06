import { ruleConstants } from '../_constants'

/**
 * Rules reducer
 * {
 *   ...
 *   rules: { items: [{...}], loading: true, }
 *   ...
 * }
 * @param  {Object} state  current state
 * @param  {Object} action reducer action
 * @return {Object}        new state
 */
export function rules(state = {items: [], copyRules: [], loading: false}, action) {

    switch (action.type) {

        case ruleConstants.CLEAR:
            return {items: [], copyRules: [], loading: false}
            break

        case ruleConstants.CREATE_REQUEST:
            return { ...state, loading: true, }
            break

        case ruleConstants.CREATE_SUCCESS:
            state.items.push(action.rule)
            return { ...state, loading: false, }
            break

        case ruleConstants.CREATE_FAILURE:
            return { ...state, loading: false, }
            break

        case ruleConstants.GETALL_REQUEST:
            return { ...state, loading: true, }
            break

        case ruleConstants.GETALL_SUCCESS:
            return { ...state, items: action.rules, loading: false, }
            break

        case ruleConstants.GETALL_FAILURE:
            return { ...state, loading: false, }
            break

        case ruleConstants.DELETE_REQUEST:
            // mark the rule as being deleted
            return {
                ...state,
                items: state.items.map(rule =>
                    rule.id === action.id
                        ? { ...rule, deleting: true }
                        : rule
                ),
                loading: true,
            }
            break

        case ruleConstants.DELETE_SUCCESS:
            // remove the rule
            return {
                ...state,
                items: state.items.filter(rule => rule.id !== action.id),
                loading: false,
            }
            break

        case ruleConstants.DELETE_FAILURE:
            // remove the deleting:true flag and add error
            return {
                ...state,
                items: state.items.map(rule => {
                    if (rule.id === action.id) {
                        // copy rule (without the deleting flag)
                        const { deleting, ...ruleCopy } = rule
                        // return the copied rule with delete error
                        return { ...ruleCopy, deleteError: action.error }
                    }
                    return rule
                }),
                loading: false,
            }
            break

        case ruleConstants.GET_COPY_RULES_REQUEST:
            return { ...state, loading: true }
            break

        case ruleConstants.GET_COPY_RULES_SUCCESS:
            return { ...state, copyRules: action.rules, loading: false }
            break

        case ruleConstants.GET_COPY_RULES_FAILURE:
            return { ...state, loading: false }
            break

        case ruleConstants.COPY_RULES_REQUEST:
            return { ...state, loading: true }
            break

        case ruleConstants.COPY_RULES_SUCCESS:
            return { ...state, items: [ ...state.items, ...action.rules ], loading: false }
            break

        case ruleConstants.COPY_RULES_FAILURE:
            return { ...state, loading: false }
            break

        default:
            return state
    }

}
