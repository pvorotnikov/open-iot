import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import { Segment, Icon, Button, Label, Form, Step, Divider, TextArea, Popup, List } from 'semantic-ui-react'

import { alertActions, integrationActions } from '../_actions'
import { ConfirmModal, HighlightBlock } from '../_components'

class PipelineCreator extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                topic: '',
                pipeline: [],
                module: null,
                args: '',
            }
        }
    }

    moduleOptions() {
        return this.props.modules.items.map(m => ({
            text: `${m.name} (${m.description})`,
            value: m.id,
            disabled: 'enabled' !== m.status,
        }))
    }

    onChange(e, data) {
        let { name, value } = data
        if ('topic' === name) value = value.trim()
        this.setState({ values: {
            ...this.state.values,
            [name]: value
        }})
    }

    onPipelineStepRemove(e, index) {
        e.preventDefault()
        this.setState({ values: {
            ...this.state.values,
            pipeline: this.state.values.pipeline.filter((s, i) => i !== index),
        }})
    }

    onPipelineStepCreate() {
        const modules = this.props.modules.items
        const { module, args } = this.state.values
        let parsedArguments = {}
        this.props.dispatch(alertActions.clear())
        if ('' !== args.trim()) {
            try {
                parsedArguments = JSON.parse(args)
            } catch (err) {
                this.props.dispatch(alertActions.error('Arguments are not in valid JSON format.'))
                return
            }
        }

        modules.forEach(m => {
            if (m.id === module) {
                let newPipelineStep = m
                newPipelineStep.arguments = parsedArguments
                this.setState({ values: {
                    ...this.state.values,
                    pipeline: [...this.state.values.pipeline, newPipelineStep]
                }})
            }
        })
    }

    onPipelineSave() {

        this.props.dispatch(alertActions.clear())
        if ('' === this.state.values.topic) {
            this.props.dispatch(alertActions.error('Topic cannot be empty.'))
            return
        }

        let pipelineDefinition = this.state.values.pipeline.map(s => ({
            module: s.id,
            arguments: s.arguments,
        }))
        this.props.dispatch(integrationActions.create(this.state.values.topic, pipelineDefinition))
    }

    renderPipelineSteps() {
        const { pipeline } = this.state.values

        if (!pipeline.length) {
            return (
                <Step>
                    <Icon name='chevron circle right' />
                    <Step.Content>
                        <Step.Title>No pipline steps</Step.Title>
                        <Step.Description>Clients will still be able to publish and subscribe to this topic.</Step.Description>
                    </Step.Content>
                </Step>
            )
        }

        let pipelineSteps = pipeline.map((s, i) => {

            const stepContents = (
                <Step>
                    <Icon name='chevron circle right' />
                </Step>
            )

            return (
                <Popup key={'step-' + i} trigger={stepContents} on='click' flowing hoverable>
                    <Popup.Content>
                        <List>
                            <List.Item>
                                <Label horizontal>Module</Label>
                                {s.name}
                            </List.Item>
                            <List.Item>
                                <Label horizontal>Arguments</Label>
                                <HighlightBlock language='json'>{ JSON.stringify(s.arguments) }</HighlightBlock>
                            </List.Item>
                            <List.Item>
                                <a href='#' onClick={(e) => this.onPipelineStepRemove(e, i)}><Icon name='delete' />Remove</a>
                            </List.Item>
                        </List>
                    </Popup.Content>
                </Popup>
            )
        })
        return pipelineSteps
    }

    render() {

        return (
            <Segment raised color='blue'>
                <Label color='blue' ribbon>Pipeline Creator</Label>

                <Form size='small' style={{ marginTop: '10px' }}>

                    <Form.Input name='topic'
                        label='Topic'
                        value={ this.state.values.topic }
                        onChange={ this.onChange.bind(this) } />

                    <Step.Group size='mini' fluid>
                        { this.renderPipelineSteps() }
                    </Step.Group>

                    <Divider horizontal>Pipeline Step</Divider>

                    <Form.Dropdown name='module'
                        label='Module'
                        placeholder='Module'
                        selection
                        value={ this.state.values.module }
                        options={ this.moduleOptions() }
                        onChange={ this.onChange.bind(this) } />

                    <Form.TextArea name='args'
                        label='Arguments (in JSON)'
                        value={ this.state.values.args }
                        onChange={ this.onChange.bind(this) } />

                    <Button circular
                        icon='plus'
                        label='Pipeline Step'
                        color='blue'
                        onClick={ this.onPipelineStepCreate.bind(this) } />

                    <Divider horizontal>Save</Divider>

                    <Button circular
                        icon='save'
                        label='Create'
                        color='green'
                        onClick={ this.onPipelineSave.bind(this) } />
                </Form>

            </Segment>
        )
    }

}

PipelineCreator.propTypes = {
    modules: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { modules } = state
    return {
        modules
    }
}

const connectedPipelineCreator = connect(mapStateToProps)(withRouter(PipelineCreator))
export { connectedPipelineCreator as PipelineCreator }
