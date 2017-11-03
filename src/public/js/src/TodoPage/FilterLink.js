import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { todoActions } from '../_actions'

class FilterLink extends Component {
    render() {
        return <a href="#" onClick={e => {
            e.preventDefault()
            this.props.onClick()
        }}>{this.props.children}</a>
    }
}

FilterLink.propTypes = {
    active: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired
}


const mapStateToProps = (state, ownProps) => {
    return {
        active: ownProps.filter === state.visibilityFilter
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onClick: () => {
            dispatch(todoActions.setFilter(ownProps.filter))
        }
    }
}

const connectedLink = connect(mapStateToProps, mapDispatchToProps)(FilterLink)

export { connectedLink as FilterLink }
