import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { Segment, Header, Container, Button } from 'semantic-ui-react'

import { userActions } from '../_actions'

class HomePage extends Component {

    componentDidMount() {
        this.props.dispatch(userActions.getAll())
    }

    handleDeleteUser(id) {
        return (e) => this.props.dispatch(userActions.delete(id))
    }

    handleLogout(e) {
        this.props.dispatch(userActions.logout())
    }

    render() {
        const { user, users } = this.props

        let userItems = users.items
            ? users.items.map((user, index) => (<Segment key={user.id}>{`${user.firstName} ${user.lastName}`}</Segment>))
            : users.loading
                ? <Segment>Loading</Segment>
                : null

        return (
            <Container>
                <Header as='h1'>Hi {user.firstName}!</Header>
                <Header as='h3'>Registered users</Header>
                <Segment.Group>
                    {userItems}
                </Segment.Group>
                <Button onClick={ e => this.handleLogout(e) }>Logout</Button>
            </Container>
        )
    }
}

HomePage.propTypes = {
    users: PropTypes.object,
    user: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { users, authentication } = state
    const { user } = authentication
    return {
        user,
        users,
    }
}

const connectedHomePage = connect(mapStateToProps)(HomePage)
export { connectedHomePage as HomePage }
