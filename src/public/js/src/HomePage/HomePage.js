import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Header, Container, Icon } from 'semantic-ui-react'

import { userActions } from '../_actions'

class HomePage extends Component {

    render() {
        const { user } = this.props

        return (
            <Container>
                <Header as='h1'>
                    <Icon name='home' circular />
                    <Header.Content>Hi {user.firstName} {user.lastName}!</Header.Content>
                </Header>
            </Container>
        )
    }
}

HomePage.propTypes = {
    user: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { authentication } = state
    const { user } = authentication
    return {
        user,
    }
}

const connectedHomePage = connect(mapStateToProps)(HomePage)
export { connectedHomePage as HomePage }
