import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import { Header, Segment, Container, Icon, Loader, Label, List, Step, Popup } from 'semantic-ui-react'

import { moduleActions, integrationActions } from '../_actions'
import { PipelineCreator } from './'
import { ConfirmModal, HighlightBlock } from '../_components'

class IntegrationsPage extends Component {

    componentDidMount() {
        this.props.dispatch(moduleActions.getAll())
        this.props.dispatch(integrationActions.getAll())
    }

    onDeleteIntegration(integrationId) {
        this.props.dispatch(integrationActions.delete(integrationId))
    }

    onEnableDisableIntegration(integrationId, status) {
        this.props.dispatch(integrationActions.setStatus(integrationId, status))
    }

    onEnableDisablePipelineStep(e, integrationId, stepIndex, status) {
        e.preventDefault()
        console.log(`Setting ${integrationId} step ${stepIndex} to ${status}`)
        this.props.dispatch(integrationActions.setStepStatus(integrationId, stepIndex, status))
    }

    getModuleName(moduleId) {
        let moduleName = moduleId
        this.props.modules.items.forEach(m => {
            if (m.id === moduleId) moduleName = m.name
        })
        return moduleName
    }

    renderIntegrations() {
        const integrations = this.props.integrations.items
        const modules = this.props.modules.items

        const items = integrations.map(integration => {

            const fullTopic = `:appId/:gatewayId/${integration.topic}`
            const topicStep = (
                <Step>
                    <Icon name='announcement' />
                    <Step.Content>
                        <Step.Title>Topic</Step.Title>
                        <Step.Description>{integration.topic}</Step.Description>
                    </Step.Content>
                </Step>
            )

            const pipelineSteps = integration.pipeline.map((step, i) => {

                const stepContents = (
                    <Step>
                        <Icon name='chevron circle right' color={
                            'enabled' === step.status
                                ? 'black'
                                : 'disabled' === step.status
                                    ? 'grey'
                                    : 'red'
                            } />
                    </Step>
                )

                return (
                    <Popup key={'step-' + i} trigger={stepContents} on='click' flowing hoverable>
                        <Popup.Content>
                            <List>
                                <List.Item>
                                    <Label horizontal>Module</Label> {this.getModuleName(step.module)}
                                </List.Item>
                                <List.Item>
                                    <Label horizontal>Arguments</Label>
                                    <HighlightBlock language='json'>{ JSON.stringify(step.arguments) }</HighlightBlock>
                                </List.Item>
                                { 'enabled' === step.status &&
                                    <List.Item>
                                        <a href='#' onClick={(e) => this.onEnableDisablePipelineStep(e, integration.id, i, 'disabled')}>Disable</a>
                                    </List.Item>
                                }
                                { 'disabled' === step.status &&
                                    <List.Item>
                                        <a href='#' onClick={(e) => this.onEnableDisablePipelineStep(e, integration.id, i, 'enabled')}>Enable</a>
                                    </List.Item>
                                }
                            </List>
                        </Popup.Content>
                    </Popup>
                )
            })

            return (
                <List.Item key={integration.id}>
                    <Step.Group size='mini' fluid>

                        <Popup trigger={topicStep} flowing hoverable>
                            <Popup.Content>
                                <List>
                                    <List.Item>
                                        <Label horizontal>MQTT</Label> {fullTopic}
                                    </List.Item>
                                    <List.Item>
                                        <Label horizontal>HTTP</Label> POST /publish/{fullTopic}
                                    </List.Item>
                                </List>
                            </Popup.Content>
                        </Popup>

                        { pipelineSteps }

                        <Step>
                            <Step.Content>
                                { 'enabled' === integration.status && <Label
                                    as='a'
                                    color='grey'
                                    size='tiny'
                                    onClick={() => this.onEnableDisableIntegration(integration.id, 'disabled')}>
                                    Disable
                                </Label> }
                                { 'disabled' === integration.status && <Label
                                    as='a'
                                    color='green'
                                    size='tiny'
                                    onClick={() => this.onEnableDisableIntegration(integration.id, 'enabled')}>
                                    Enable
                                </Label> }
                                <ConfirmModal
                                    trigger={<Label as='a' color='red' size='tiny'>Delete</Label>}
                                    title='Are you sure you want to delete this integration?'
                                    onConfirm={() => this.onDeleteIntegration(integration.id)} />
                            </Step.Content>
                        </Step>

                    </Step.Group>
                </List.Item>
            )

        })

        return (
            <Segment raised color='green'>
                <Label color='green' ribbon>Available integrations</Label>
                <List divided relaxed>{items}</List>
            </Segment>
        )
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

                { this.renderIntegrations() }

                <PipelineCreator />

            </Container>
        )
    }
}

IntegrationsPage.propTypes = {
    modules: PropTypes.object,
    integrations: PropTypes.object,
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
