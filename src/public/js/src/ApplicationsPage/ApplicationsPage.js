import React, { Component } from 'react'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Header, Container, Icon, Card, Button } from 'semantic-ui-react'

import { appActions } from '../_actions'
import { history } from '../_helpers'

class ApplicationsPage extends Component {

    componentDidMount() {
        this.props.dispatch(appActions.getAll())
    }

    renderNewAppCard() {
        return (
            <Card>
                <Card.Content>
                    <Card.Header>My application</Card.Header>
                    <Card.Meta>My first app</Card.Meta>
                    <Card.Description>
                        Create your first application.
                        Applications allow your gateways to connect to the cloud.
                        You can add one or more gateways to your application.
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <Button circular icon='plus' label='Create' color='green' onClick={e => history.push('/apps/new') } />
                </Card.Content>
            </Card>
        )
    }

    renderAppCards() {
        const { apps } = this.props
        return (<div>Application list comes here</div>)
    }

    render() {
        const { apps } = this.props

        return (
            <Container>
                <Header as='h1'>
                    <Icon name='lab' circular />
                    <Header.Content>My Apps</Header.Content>
                </Header>
                <Card.Group>
                    { apps.items && apps.items.length ? this.renderAppCards() : this.renderNewAppCard() }
                </Card.Group>
            </Container>
        )
    }
}

ApplicationsPage.propTypes = {
    apps: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { apps } = state
    return {
        apps
    }
}

const connectedApplicationsPage = connect(mapStateToProps)(ApplicationsPage)
export { connectedApplicationsPage as ApplicationsPage }
