export * from './alert.constants'
export * from './user.constants'
export * from './app.constants'
export * from './gateway.constants'
export * from './rule.constants'
export * from './scope.constants'
export * from './setting.constants'
export * from './module.constants'
export * from './integration.constants'
export * from './persistency.constants'
export * from './tag.constants'
export * from './todo.constants' // TODO: remove this eventually

export const ACTION_REPUBLISH = 'republish'
export const ACTION_ENQUEUE = 'enqueue'
export const ACTION_DISCARD = 'discard'
export const FEEDBACK_CHANNEL = 'message'
export const ACCESS_LEVEL = {
    USER: 10,
    POWER_USER: 20,
    SERVICE: 30,
    MANAGER: 40,
    ADMIN: 50,
}
