import React, { Component } from 'react'
import { todoConstants } from '../_constants'
import { FilterLink } from './'

export class Footer extends Component {
    render() {
        return (
            <p>
                Show:
                {' '} <FilterLink filter={todoConstants.FILTER_SHOW_ALL}>All</FilterLink>
                {', '} <FilterLink filter={todoConstants.FILTER_SHOW_ACTIVE}>Active</FilterLink>
                {', '} <FilterLink filter={todoConstants.FILTER_SHOW_COMPLETED}>Completed</FilterLink>
            </p>
        )
    }

}
