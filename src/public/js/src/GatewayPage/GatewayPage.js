import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Header, Container, Segment, Icon, Button, Form, Dimmer, Loader } from 'semantic-ui-react'

import { EditableText, ConfirmModal } from '../_components'
import { gatewayActions } from '../_actions'

class GatewayPage extends PureComponent {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                name: '',
                description: ''
            }
        }
    }

    componentDidMount() {
        this.props.dispatch(gatewayActions.getSingle(this.props.match.params.gw))
    }

    onChange(e, data) {
        let { name, value } = data
        value = value.trim()
        this.setState({ values: {
            ...this.state.values,
            [name]: value
        }})
    }

    onSubmit(e) {
        const { name, description } = this.state.values
        const application = this.props.match.params.id
        if (name && description) {
            this.props.dispatch(gatewayActions.create({ application, name, description }, this.props.history))
        }
    }

    onEditableTextUpdate(name, value) {
        const { gateway } = this.props
        let trimmedValue = value.trim()
        let updatedGateway = {
            [name]: trimmedValue,
        }
        this.props.dispatch(gatewayActions.update(gateway.id, updatedGateway))
    }

    renderHeader() {
        const { gateway } = this.props
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='connectdevelop' circular />
                    <Header.Content>
                        <EditableText text={gateway.name || ''} onUpdate={(value) => this.onEditableTextUpdate('name', value)} />
                        <Loader active={this.props.loading} inline size='small' />
                        <Header.Subheader>{gateway.id && `ID: ${gateway.id}`}</Header.Subheader>
                        <Header.Subheader>
                            Alias: <EditableText text={gateway.alias || ''} onUpdate={(value) => this.onEditableTextUpdate('alias', value.toLowerCase().replace(/\s/g, ''))} />
                        </Header.Subheader>
                    </Header.Content>
                </Header>
                <EditableText text={gateway.description || ''} onUpdate={(value) => this.onEditableTextUpdate('description', value)} />
            </Container>
        )
    }

    render() {
        const { history, gateway } = this.props

        return (
            <Container>
                { this.renderHeader() }
            </Container>
        )
    }
}

GatewayPage.propTypes = {
    loading: PropTypes.bool,
    gateway: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { gateways } = state
    const { loading } = gateways
    return {
        gateway: gateways.gateway,
        loading,
    }
}

const connectedGatewayPage = connect(mapStateToProps)(withRouter(GatewayPage))
export { connectedGatewayPage as GatewayPage }
