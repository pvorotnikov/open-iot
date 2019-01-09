import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
    Container,
    Segment,
    Label,
    List,
    Form,
    Dimmer,
    Loader,
    Button,
    Step,
    Icon,
    Popup,
    Divider,
    Message,
} from 'semantic-ui-react'

import { ruleActions, settingActions } from '../_actions'
import { ACTION_REPUBLISH, ACTION_ENQUEUE, ACTION_DISCARD } from '../_constants'
import { ConfirmModal, HighlightBlock } from '../_components'

class Rules extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                topic: '',
                transformation: '',
                action: null,
                output: '',
                scope: '',
                copyApp: '',
            }
        }
    }

    componentDidMount() {
        this.props.dispatch(settingActions.getIntegrationMode())
    }

    getScopeName(scopeId) {
        let name = scopeId
        this.props.scopes.forEach(s => {
            if (s.id === scopeId) {
                name = s.name
            }
        })
        return name
    }

    actionOptions() {
        return [
            {text: 'Discard (allow publishing and subscribing)', value: ACTION_DISCARD},
            {text: 'Republish', value: ACTION_REPUBLISH},
            {text: 'Enqueue', value: ACTION_ENQUEUE},
        ]
    }

    scopeOptions() {
        const { id, name } = this.props.application
        return this.props.scopes.map(s => (
            id === s.id
                ? {text: `${s.name} (this app)`, value: s.id}
                : s.own
                    ? {text: s.name, value: s.id}
                    : {text: `${s.name} (public app)`, value: s.id}
        ))
    }

    copyAppOptions() {
        const { id, name } = this.props.application
        return this.props.scopes.filter(s => id !== s.id).map(s => (
            s.own
                ? {text: s.name, value: s.id}
                : {text: `${s.name} (public app)`, value: s.id}
        ))
    }

    onChange(e, data) {
        let { name, value } = data
        if ('topic' === name) value = value.trim()
        this.setState({ values: {
            ...this.state.values,
            [name]: value
        }})
    }

    onCopyApplicationChange(e, data) {
        this.onChange(e, data)
        this.props.dispatch(ruleActions.getCopyRules(data.value))
    }

    onFormSubmit() {
        let { topic, transformation, action, output, scope } = this.state.values
        let rule = null

        // validate values
        switch (action) {
            case ACTION_DISCARD:
                if ('' !== topic) rule = { topic, transformation, action }
                else return
                break

            case ACTION_ENQUEUE:
            case ACTION_REPUBLISH:
                if ('' !== topic && '' !== output && '' != scope) rule = { topic, transformation, action, output, scope }
                else return
                break
        }

        // notify parent
        if (rule) {
            this.props.onSubmit(rule)
        }

        // reset state
        this.setState({ values: {
            topic: '',
            transformation: '',
            action: null,
            output: '',
            scope: '',
            copyApp: '',
        }})
    }

    onDeleteRule(id) {
        this.props.onDelete(id)
    }

    onCopyRules() {
        const source = this.state.values.copyApp
        const destination = this.props.application.id

        // validate values
        if (!source || !destination || '' === source || '' === destination) return

        this.props.dispatch(ruleActions.copyRules(source, destination))
    }

    renderNewRule() {
        let complement = null

        if (this.state.values.action === ACTION_REPUBLISH) {
            complement = (
                <Form.Group widths='equal'>
                    <Form.Dropdown name='scope'
                    label='Republish scope'
                    placeholder='Republish scope'
                    selection
                    value={ this.state.values.scope }
                    options={ this.scopeOptions() }
                    onChange={ this.onChange.bind(this) } />
                    <Form.Input name='output'
                        label='Republish topic'
                        value={ this.state.values.output }
                        onChange={ this.onChange.bind(this) } />
                </Form.Group>
            )
        } else if (this.state.values.action === ACTION_ENQUEUE) {
            complement = (
                <Form.Group widths='equal'>
                    <Form.Dropdown name='scope'
                    label='Queue scope'
                    placeholder='Queue scope'
                    selection
                    value={ this.state.values.scope }
                    options={ this.scopeOptions() }
                    onChange={ this.onChange.bind(this) } />
                    <Form.Input name='output'
                        label='Queue name'
                        value={ this.state.values.output }
                        onChange={ this.onChange.bind(this) } />
                </Form.Group>
            )
        }

        return (
            <Form size='small'>

                <Form.Input name='topic'
                    label='Topic'
                    value={ this.state.values.topic }
                    onChange={ this.onChange.bind(this) } />
                <Form.TextArea name='transformation'
                    label='Transformation'
                    value={ this.state.values.transformation }
                    onChange={ this.onChange.bind(this) } />
                <Form.Dropdown name='action'
                    label='Action'
                    placeholder='Select an action'
                    selection
                    value={ this.state.values.action }
                    options={ this.actionOptions() }
                    onChange={ this.onChange.bind(this) } />
                { complement }
                <Button circular
                    icon='plus'
                    label='Add'
                    color='green'
                    onClick={ this.onFormSubmit.bind(this) } />
            </Form>
        )
    }

    renderCopyApp() {

        let copyRules = this.props.copyRules.map(r => (
            <List.Item key={r.id}>
                <List.Content>
                    <Icon name='announcement' />{ r.topic }
                </List.Content>
            </List.Item>
        ))

        return (
            <div>
                <p>Synchronize with rules defined in another application. They will be copied into this app as new rules.</p>
                <Form size='small'>
                    <Form.Dropdown name='copyApp'
                        label='Copy application'
                        placeholder='Copy application'
                        selection
                        value={ this.state.values.copyApp }
                        options={ this.copyAppOptions() }
                        onChange={ this.onCopyApplicationChange.bind(this) } />
                    <List>
                        { copyRules }
                    </List>
                    <Button circular
                        icon='copy'
                        label='Copy'
                        color='blue'
                        onClick={ this.onCopyRules.bind(this) } />
                </Form>
            </div>
        )
    }

    renderRules() {
        const { rules } = this.props
        const items = rules.items
        .sort((a, b) => a.topic > b.topic ? 1 : a.topic < b.topic ? -1 : 0)
        .map(r => {

            let actionStep = null

            switch (r.action) {
                case ACTION_DISCARD:
                    actionStep = (
                        <Step>
                            <Icon name='dont' />
                            <Step.Content>
                                <Step.Title>No action</Step.Title>
                                <Step.Description>The message will be discarded</Step.Description>
                            </Step.Content>
                        </Step>
                    )
                    break

                case ACTION_REPUBLISH:
                    actionStep = (
                        <Step>
                            <Icon name='reply' />
                            <Step.Content>
                                <Step.Title>Republish on topic</Step.Title>
                                <Step.Description>
                                    <div>{r.output}</div>
                                    <div>({this.getScopeName(r.scope)})</div>
                                </Step.Description>
                            </Step.Content>
                        </Step>
                    )
                    break

                case ACTION_ENQUEUE:
                    actionStep = (
                        <Step>
                            <Icon name='angle double right' />
                            <Step.Content>
                                <Step.Title>Enqueue</Step.Title>
                                <Step.Description>
                                    <div>{r.output}</div>
                                    <div>({this.getScopeName(r.scope)})</div>
                                </Step.Description>
                            </Step.Content>
                        </Step>
                    )
                    break
            }

            const fullTopic = `:appId/:gatewayId/${r.topic}`
            const topicStep = (
                <Step>
                    <Icon name='announcement' />
                    <Step.Content>
                        <Step.Title>Topic</Step.Title>
                        <Step.Description>{r.topic}</Step.Description>
                    </Step.Content>
                </Step>
            )

            const transformationStep = (
                <Step disabled={'' === r.transformation}>
                    <Icon name='settings' />
                    <Step.Content>
                        <Step.Title>Transformation</Step.Title>
                    </Step.Content>
                </Step>
            )

            return (
                <List.Item key={r.id}>
                    <Step.Group size='mini' fluid widths={4}>
                        <Popup trigger={topicStep} flowing hoverable>
                            <Popup.Content>
                                <List>
                                    <List.Item>
                                        <Label horizontal>MQTT</Label>
                                        {fullTopic}
                                    </List.Item>
                                    <List.Item>
                                        <Label horizontal>HTTP</Label>
                                        POST /publish/{fullTopic}
                                    </List.Item>
                                </List>
                            </Popup.Content>
                        </Popup>
                        <Popup trigger={transformationStep} flowing hoverable>
                            <Popup.Content as='pre'>
                                <HighlightBlock language='cson'>{r.transformation}</HighlightBlock>
                            </Popup.Content>
                        </Popup>
                        { actionStep }
                        <Step>
                            <Step.Content>
                                <Label as='a' color='grey' size='tiny'>Disable</Label>
                                <ConfirmModal
                                    trigger={<Label as='a' color='red' size='tiny'>Delete</Label>}
                                    title='Are you sure you want to delete this rule?'
                                    onConfirm={() => this.onDeleteRule(r.id)} />
                            </Step.Content>
                        </Step>
                    </Step.Group>
                </List.Item>
            )
        })

        return <List divided relaxed>{items}</List>
    }

    render() {

        const { loading } = this.props.rules
        const { integrationMode } = this.props

        if (integrationMode === 'rules') {

            return (
                <Segment raised>
                    <Dimmer active={loading} inverted>
                        <Loader inverted />
                    </Dimmer>
                    <Label color='blue' ribbon>Rules</Label>
                    <p style={{padding: "10px 10px 0 10px"}}>
                        You can specify rules that can be executed when a message
                        is received on a given topic. You can transform the JSON
                        payload of a message and republish it on another topic or
                        enqueue it within the scope of an application.
                        Note that in order to publish a message on a given topic,
                        you need to create a rule for it first.
                    </p>
                    { this.renderRules() }
                    <Divider horizontal>Create rule</Divider>
                    { this.renderNewRule() }
                    <Divider horizontal>Copy rules from another app</Divider>
                    { this.renderCopyApp() }
                </Segment>
            )

        } else {

            return (
                <Message warning>
                    <Message.Header>Rules are not supported in this mode</Message.Header>
                    <p>The current integration mode is set to <b>"{ integrationMode }"</b>.
                       You need to change the value of the <b>global.integrationmode</b> setting to <b>"rules"</b>.</p>
                </Message>
            )
        }
    }

}

Rules.propTypes = {
    application: PropTypes.object.isRequired,
    scopes: PropTypes.array.isRequired,
    rules: PropTypes.object.isRequired,
    integrationMode: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    copyRules: PropTypes.array.isRequired,
}

Rules.defaultProps = {
    application: {},
    scopes: [],
}

function mapStateToProps(state) {
    const { rules, settings } = state
    const { copyRules } = rules
    return {
        copyRules,
        integrationMode: settings.integrationMode,
    }
}

const connectedRules = connect(mapStateToProps)(Rules)
export { connectedRules as Rules }
