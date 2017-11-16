import React, { Component } from 'react'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Rules } from './'

import {
    Header,
    Container,
    Icon,
    Button,
    Loader,
    Segment,
    Label,
    List,
    Card,
    Dimmer,
} from 'semantic-ui-react'

import { appActions, gatewayActions, ruleActions } from '../_actions'
import { history } from '../_helpers'
import { EditableText } from '../_components'

class ApplicationPage extends Component {

    componentDidMount() {
        this.props.dispatch(appActions.getSingle(this.props.match.params.id))
        this.props.dispatch(gatewayActions.getAll(this.props.match.params.id))
        this.props.dispatch(ruleActions.getAll(this.props.match.params.id))
    }

    onEditableTextUpdate(name, value) {
        const { app } = this.props
        value = value.trim()
        let updatedApp = {
            [name]: value,
        }
        this.props.dispatch(appActions.update(app.id, updatedApp))
    }

    refreshKey() {
        this.props.dispatch(appActions.refreshKey(this.props.app.id))
    }

    refreshSecret() {
        this.props.dispatch(appActions.refreshSecret(this.props.app.id))
    }

    handleDeleteGateway(id) {
        this.props.dispatch(gatewayActions.delete(id))
    }

    handleDeleteApp() {
        this.props.dispatch(appActions.delete(this.props.match.params.id))
    }

    renderHeader() {
        const { app } = this.props
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='lab' circular />
                    <Header.Content>
                        <EditableText text={app.name || ''} onUpdate={(value) => this.onEditableTextUpdate('name', value)} />
                        <Loader active={this.props.loading} inline size='small' />
                        <Header.Subheader>{app.id && `ID: ${app.id}`}</Header.Subheader>
                    </Header.Content>
                </Header>
                <EditableText text={app.description || ''} onUpdate={(value) => this.onEditableTextUpdate('description', value)} />
            </Container>
        )
    }

    renderCredentials() {
        const { app } = this.props
        return (
            <Segment raised>
                <Label color='blue' ribbon>Credentials</Label>
                <List>
                    <List.Item>
                        <Label horizontal>Access key</Label>
                        <span>
                            {app.key}
                            <Icon link name='refresh' style={{marginLeft: '10px'}} onClick={this.refreshKey.bind(this)} />
                        </span>
                    </List.Item>
                    <List.Item>
                        <Label horizontal>Secret key</Label>
                        <span>
                            {app.secret}
                            <Icon link name='refresh' style={{marginLeft: '10px'}} onClick={this.refreshSecret.bind(this)} />
                        </span>
                    </List.Item>
                </List>
            </Segment>
        )
    }

    renderGateways() {
        const { gateways } = this.props
        return (
            <Segment raised>
                <Label color='blue' ribbon>Gateways</Label>
                <Card.Group style={{ marginTop: '5px' }}>
                    { gateways.items && gateways.items.length
                        ? this.renderGatewaysCards()
                        : this.renderNewGatewayCard() }
                </Card.Group>
            </Segment>
        )
    }

    renderSettings() {
        return (
            <Segment raised>
                <Label color='blue' ribbon>Settings</Label>
                <List>
                    <List.Item>
                        <Button circular icon='delete' label='Delete app' color='red' onClick={ e => this.handleDeleteApp() } />
                    </List.Item>
                </List>
            </Segment>
        )
    }

    renderNewGatewayCard() {
        const appId = this.props.match.params.id
        return (
            <Card key={'new-gateway'}>
                <Card.Content>
                    <Card.Header>New gateway</Card.Header>
                    <Card.Meta>My gateway</Card.Meta>
                    <Card.Description>
                        Create a new gateway.
                        Gateways establish connection to the cloud.
                        You can connect your end-devices to gateways
                        allowing them to send and receive information
                        or gateway can act as end devices.
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <Button circular icon='plus' label='Create' color='green' onClick={e => history.push(`/apps/i/${appId}/newgw`) } />
                </Card.Content>
            </Card>
        )
    }

    renderGatewaysCards() {
        const { gateways } = this.props
        const cards = gateways.items.map(gateway => (
            <Card key={gateway.id}>
                <Dimmer active={gateway.deleting} inverted>
                    <Loader inverted />
                </Dimmer>
                <Card.Content>
                    <Card.Header>{gateway.name}</Card.Header>
                    <Card.Meta>ID: {gateway.id}</Card.Meta>
                    <Card.Description>
                        {gateway.description}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <Button circular icon='delete' label='Delete' color='red' onClick={ e => this.handleDeleteGateway(gateway.id) } />
                </Card.Content>
            </Card>
        ))
        cards.push(this.renderNewGatewayCard())
        return cards
    }

    render() {
        const { app } = this.props
        return (
            <Container>
                { this.renderHeader() }
                { this.renderCredentials() }
                { this.renderGateways() }
                <Rules app={this.props.app} />
                { this.renderSettings() }
            </Container>
        )
    }
}

ApplicationPage.propTypes = {
    loading: PropTypes.bool,
    app: PropTypes.object.isRequired,
    gateways: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
}

ApplicationPage.defaultProps = {
    app: {},
    gateways: {},
}

function mapStateToProps(state) {
    const { apps, gateways } = state
    const { app, loading } = apps
    return {
        app,
        loading,
        gateways,
    }
}

const connectedApplicationPage = connect(mapStateToProps)(ApplicationPage)
export { connectedApplicationPage as ApplicationPage }
