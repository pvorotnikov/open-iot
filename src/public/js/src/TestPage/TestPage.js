import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Header, Container, Icon, List, Button, Loader, Form, Dimmer, Segment, Label } from 'semantic-ui-react'

import mqtt from 'mqtt'
import moment from 'moment'

import { appActions, gatewayActions, ruleActions } from '../_actions'

class TestPage extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                app: '',
                gateway: '',
                topic: '',
                message: '',
            },
            messages: [],
            subscribed: false,
        }

        this.mqttClient = null
    }

    componentDidMount() {
        this.props.dispatch(appActions.getAll())
    }

    componentWillUnmount() {
        this.mqttDisconnect()
        this.props.dispatch(appActions.clear())
        this.props.dispatch(gatewayActions.clear())
        this.props.dispatch(ruleActions.clear())
    }

    availableApps() {
        const { apps } = this.props
        if (apps.items) {
            return apps.items.map(a => ({ text: a.name, value: a.id }))
        } else {
            return []
        }
    }

    availableGateways() {
        const { gateways } = this.props
        if (gateways.items) {
            return [{text: 'Application-wide', value: 'all'}]
            .concat(
                gateways.items.map(g => ({ text: g.name, value: g.id }))
            )
        } else {
            return []
        }
    }

    availableTopics() {
        const { rules } = this.props
        if (rules.items) {
            return [{text: 'Feedback Channel', value: 'message'}]
            .concat(
                rules.items.map(r => ({ text: r.topic, value: r.topic }))
            )
        } else {
            return []
        }
    }

    onAppChange(e, data) {
        let { name, value } = data

        // always disconnect
        this.mqttDisconnect()

        this.setState({ values: {
            ...this.state.values,
            [name]: value.trim()
        }})

        let key, secret
        this.props.apps.items.forEach(a => {
            if (a.id === value) {
                key = a.key
                secret = a.secret
            }
        })

        if (key && secret) {
            this.mqttConnect(key, secret)
        }

        this.props.dispatch(gatewayActions.getAll(value))
        this.props.dispatch(ruleActions.getAll(value))

    }

    onChange(e, data) {
        let { name, value } = data

        // unsubscribe only if needed
        if (this.state.values[name] !== value) {
            this.unsubscribe()
        }

        this.setState({ values: {
            ...this.state.values,
            [name]: value.trim()
        }})
    }

    onMessageChange(e, data) {
        let { name, value } = data

        this.setState({ values: {
            ...this.state.values,
            [name]: value.trim()
        }})
    }

    mqttConnect(key, secret) {
        this.mqttClient = mqtt.connect({
            host: new URL(document.location.origin).hostname,
            port: 15675,
            path: '/ws',
            username: key,
            password: secret,
        })
        this.mqttClient.on('connect', () => {
            console.info('MQTT client connected')
        })
        this.mqttClient.on('reconnect', () => {
            console.info('MQTT client reconnected')
        })
        this.mqttClient.on('error', err => {
            console.warn('MQTT client error', err.message)
        })
        this.mqttClient.on('close', () => {
            console.info('MQTT client disconnected')
        })
        this.mqttClient.on('message', (topic, message) => {
            this.setState({ messages: [
                { topic, message: message.toString(), time: moment() },
                ...this.state.messages
            ]})
        })
    }

    mqttDisconnect() {
        if (this.mqttClient) {
            this.mqttClient.end()
            this.mqttClient = null
        }
    }

    subscribe() {
        const subTopic = this.makeTopic()
        if (subTopic && this.mqttClient) {
            this.mqttClient.subscribe(subTopic, (err, granted) => {
                if (!err) this.setState({ subscribed: true })
            })
        }

    }

    unsubscribe() {
        const subTopic = this.makeTopic()
        if (subTopic && this.mqttClient) {
            this.mqttClient.unsubscribe(subTopic, (err) => {
                if (!err) this.setState({ subscribed: false })
            })
        }
    }

    publish() {
        const pubTopic = this.makeTopic()
        if (pubTopic && this.mqttClient) {
            const { message } = this.state.values
            this.mqttClient.publish(pubTopic, message)
        }
    }

    renderMessages() {
        const messages = this.state.messages.map((m, i) => (
            <List.Item key={i}>
                <Icon name='envelope' />
                <List.Content>
                    <List.Description>{m.time.format('LTS')} - {m.topic}</List.Description>
                    <List.Description>{m.message}</List.Description>
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

    makeTopic() {
        const { app, gateway, topic } = this.state.values
        if (app && 'all' === gateway && topic) {
            return `${app}/${topic}`
        } else if ('' !== app && '' !== gateway && '' !== topic) {
            return `${app}/${gateway}/${topic}`
        } else {
            return null
        }
    }

    render() {
        const { apps, gateways } = this.props

        return (
            <Container>
                <Header as='h1'>
                    <Icon name='lab' circular />
                    <Header.Content>Test Playground <Loader active={apps.loading || gateways.loading} inline size='small' /></Header.Content>
                </Header>
                <Form>
                    <Dimmer active={false} inverted>
                        <Loader inverted>Connecting</Loader>
                    </Dimmer>
                    <Form.Group widths='equal'>
                        <Form.Dropdown name='app'
                            placeholder='Choose an application'
                            selection
                            value={ this.state.values.app }
                            options={ this.availableApps() }
                            onChange={ this.onAppChange.bind(this) } />

                        <Form.Dropdown name='gateway'
                            placeholder='Choose a gateway'
                            selection
                            value={ this.state.values.gateway }
                            options={ this.availableGateways() }
                            onChange={ this.onChange.bind(this) } />

                        <Form.Dropdown name='topic'
                            placeholder='Choose a topic'
                            selection
                            value={ this.state.values.topic }
                            options={ this.availableTopics() }
                            onChange={ this.onChange.bind(this) } />
                        { !this.state.subscribed && <Form.Button color='green' onClick={this.subscribe.bind(this)}>Subscribe</Form.Button> }
                        { this.state.subscribed && <Form.Button color='red' onClick={this.unsubscribe.bind(this)}>Unsubscribe</Form.Button> }
                    </Form.Group>

                    <Form.Group>
                        <Form.TextArea width={12} name='message' onChange={ this.onMessageChange.bind(this) } placeholder='Enter a message to publish' />
                        <Form.Button width={4} color='green' onClick={this.publish.bind(this)}>Publish</Form.Button>
                    </Form.Group>

                    {this.renderMessages()}

                </Form>
            </Container>
        )
    }
}

TestPage.propTypes = {
    apps: PropTypes.object,
    gateways: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    const { apps, gateways, rules } = state
    return {
        apps,
        gateways,
        rules,
    }
}

const connectedTestPage = connect(mapStateToProps)(TestPage)
export { connectedTestPage as TestPage }
