import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
    Header,
    Icon,
    List,
    Button,
    Loader,
    Form,
    Dimmer,
    Segment,
    Label
} from 'semantic-ui-react'

import moment from 'moment'

import { ACTION_REPUBLISH, FEEDBACK_CHANNEL } from '../_constants'
import { appActions, gatewayActions, ruleActions, persistencyActions } from '../_actions'
import { HighlightBlock } from '../_components'

const APPLICATION_WIDE_ALIAS = 'all'

class MessagesPage extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                app: '',
                gateway: '',
                topic: '',
            },
            extraTopics: [],
        }
    }

    componentDidMount() {
        this.props.dispatch(appActions.getAll())
    }

    componentWillUnmount() {
        this.props.dispatch(appActions.clear())
        this.props.dispatch(gatewayActions.clear())
        this.props.dispatch(ruleActions.clear())
    }

    availableApps() {
        const { apps } = this.props
        if (apps) {
            return apps
            .sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
            .map(a => ({ text: a.name, value: a.id }))
        } else {
            return []
        }
    }

    availableGateways() {
        const { gateways } = this.props
        if (gateways) {
            return gateways.map(g => ({ text: g.name, value: g.id }))
            .concat(
                [{text: 'Application-wide', value: APPLICATION_WIDE_ALIAS}]
            )
        } else {
            return []
        }
    }

    deepUnique(data) {
        return Object.values(data.reduce((r, e) => (r[e.value] = {text: e.text, value: e.value}, r), {}))
    }

    availableTopics() {
        const { rules } = this.props
        if (rules && this.state.values.gateway != '') {

            if (APPLICATION_WIDE_ALIAS === this.state.values.gateway) {
                return this.deepUnique(
                    this.state.extraTopics.map(t => ({ text: t, value: t }))
                    .concat(
                        rules
                        .filter(r => r.action === ACTION_REPUBLISH)
                        .filter(r => r.scope === this.state.values.app)
                        .map(r => ({ text: r.output, value: r.output }))
                    )
                    .sort((a, b) => a.text > b.text ? 1 : a.text < b.text ? -1 : 0)
                    .concat(
                        [{text: 'Feedback Channel', value: FEEDBACK_CHANNEL}]
                    )
                )
            }

            return this.deepUnique(
                this.state.extraTopics.map(t => ({ text: t, value: t }))
                .concat(
                    rules.map(r => ({ text: r.topic, value: r.topic }))
                )
                .sort((a, b) => a.text > b.text ? 1 : a.text < b.text ? -1 : 0)
                .concat(
                    [{text: 'Feedback Channel', value: FEEDBACK_CHANNEL}]
                )
            )

        } else {
            return []
        }
    }

    onAppChange(e, data) {
        let { name, value } = data

        this.setState({ values: {
            ...this.state.values,
            gateway: '',
            topic: '',
            [name]: value.trim()
        }})

        this.props.dispatch(gatewayActions.getAll(value))
        this.props.dispatch(ruleActions.getAll(value))
    }

    onChange(e, data) {
        let { name, value } = data

        this.setState({ values: {
            ...this.state.values,
            [name]: value.trim()
        }})
    }

    onAddTopic(e, data) {
        this.setState({
            extraTopics: [
                ...this.state.extraTopics,
                data.value
            ]
        })
    }

    onView() {
        const { apps, dispatch } = this.props
        const subTopic = this.makeTopic()

        if (subTopic) {

            let key, secret
            const selectedAppId = this.state.values.app
            apps.forEach(app => {
                if (app.id === selectedAppId) {
                    key = app.key
                    secret = app.secret
                }
            })

            console.log('Should view messages for topic', subTopic)
            console.log('App key', key)
            console.log('App secret', secret)

            dispatch(persistencyActions.get(subTopic, key, secret))
        }
    }

    renderMessages() {

        const messages = this.props.persistency.map((m, i) => (
            <List.Item key={i}>
                <List.Header>
                    <Icon name='envelope' />
                    {moment(m.created).format('LTS')} - {m.topic}
                </List.Header>
                <List.Content as='pre'>
                    <HighlightBlock>{JSON.stringify(m.payload)}</HighlightBlock>
                </List.Content>
            </List.Item>
        ))
        return (
            <Segment raised>
                <Label color='blue' ribbon>Messages</Label>
                <List relaxed>{messages}</List>
            </Segment>
        )
    }

    canView() {
        return null !== this.makeTopic()
    }

    makeTopic() {
        const { app, gateway, topic } = this.state.values
        if (app && APPLICATION_WIDE_ALIAS === gateway && topic) {
            return `${app}/${topic}`
        } else if ('' !== app && '' !== gateway && '' !== topic) {
            return `${app}/${gateway}/${topic}`
        } else {
            return null
        }
    }

    render() {
        const { loading } = this.props

        return (
            <div>
                <Header as='h1'>
                    <Icon name='mail' circular />
                    <Header.Content>
                        Messages
                        <Loader active={loading} inline size='small' />
                    </Header.Content>
                </Header>
                <Form>
                    <Form.Group widths='equal'>
                        <Form.Dropdown name='app'
                            placeholder='Choose an application'
                            selection
                            search
                            value={ this.state.values.app }
                            options={ this.availableApps() }
                            onChange={ this.onAppChange.bind(this) } />

                        <Form.Dropdown name='gateway'
                            placeholder='Choose a gateway'
                            selection
                            search
                            value={ this.state.values.gateway }
                            options={ this.availableGateways() }
                            onChange={ this.onChange.bind(this) } />

                        <Form.Dropdown name='topic'
                            placeholder='Choose a topic'
                            selection
                            search
                            allowAdditions
                            value={ this.state.values.topic }
                            options={ this.availableTopics() }
                            onAddItem={ this.onAddTopic.bind(this) }
                            onChange={ this.onChange.bind(this) } />
                        <Form.Button disabled={!this.canView()}
                            color='green'
                            onClick={this.onView.bind(this)}>
                            View
                        </Form.Button>
                    </Form.Group>
                    {this.renderMessages()}
                </Form>
            </div>
        )
    }
}

MessagesPage.propTypes = {
    apps: PropTypes.array,
    gateways: PropTypes.array,
    rules: PropTypes.array,
    persistency: PropTypes.array,
    loading: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { apps, gateways, rules, persistency } = state
    return {
        apps: apps.items,
        gateways: gateways.items,
        rules: rules.items,
        persistency: persistency.items,
        loading: apps.loading || gateways.loading || rules.loading || persistency.loading,
    }
}

const connectedMessagesPage = connect(mapStateToProps)(MessagesPage)
export { connectedMessagesPage as MessagesPage }
