import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import { Header, Container, Icon, Card, Button, Loader, Label } from 'semantic-ui-react'

import { moduleActions, integrationActions } from '../_actions'
import { PipelineCreator } from './'

class IntegrationsPage extends Component {

    componentDidMount() {
        this.props.dispatch(moduleActions.getAll())
        this.props.dispatch(integrationActions.getAll())
    }

    render() {
        const { modules, integrations } = this.props

        return (
            <Container>
                <Header as='h1'>
                    <Icon name='fast forward' circular />
                    <Header.Content>
                        Integrations
                        <Loader active={modules.loading || integrations.loading} inline size='small' />
                    </Header.Content>
                </Header>

                <PipelineCreator />

            </Container>
        )
    }
}

IntegrationsPage.propTypes = {
    modules: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { modules, integrations } = state
    return {
        modules,
        integrations,
    }
}

const connectedIntegrationsPage = connect(mapStateToProps)(withRouter(IntegrationsPage))
export { connectedIntegrationsPage as IntegrationsPage }
