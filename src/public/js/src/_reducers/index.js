import { combineReducers } from 'redux'

import { authentication } from './authentication.reducer'
import { registration } from './registration.reducer'
import { users } from './users.reducer'
import { alert } from './alert.reducer'
import { apps } from './apps.reducer'
import { gateways } from './gateways.reducer'
import { rules } from './rules.reducer'
import { scopes } from './scopes.reducer'
import { settings } from './settings.reducer'
import { modules } from './modules.reducer'
import { integrations } from './integrations.reducer'
import { persistency } from './persistency.reducer'
import { tags } from './tags.reducer'
import { crons } from './crons.reducer'
import { plugins } from './plugins.reducer'

import { todos, visibilityFilter } from './todo.reducer'

const rootReducer = combineReducers({
    authentication, // state.authentication
    registration,   // state.registration
    users,          // state.users
    alert,          // state.alert
    apps,           // state.apps
    gateways,       // state.gateways
    rules,          // state.rules
    scopes,         // state.scopes
    settings,       // state.settings
    modules,        // state.modules
    integrations,   // state.integrations
    persistency,    // state.persistency
    tags,           // state.tags
    crons,          // state.crons
    plugins,        // state.plugins

    todos,              // TODO: remove this eventually
    visibilityFilter,   // TODO: remove this eventually
})

export default rootReducer
