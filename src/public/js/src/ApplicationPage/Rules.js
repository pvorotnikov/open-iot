import React, { Component } from 'react'
import PropTypes from 'prop-types'

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
} from 'semantic-ui-react'

export class Rules extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                topic: '',
                transformation: '',
                action: null,
                output: ''
            }
        }
    }

    actionOptions() {
        return [
            {text: 'Discard (allow publishing)', value: 'discard'},
            {text: 'Republish', value: 'republish'},
            {text: 'Enqueue', value: 'enqueue'},
        ]
    }

    onChange(e, data) {
        let { name, value } = data
        value = value.trim()
        this.setState({ values: {
            ...this.state.values,
            [name]: value.trim()
        }})
    }

    onFormSubmit() {
        let {topic, transformation, action, output} = this.state.values
        let rule = null

        // validate values
        if ('discard' !== action) {
            if ('' !== topic && '' !== action && '' !== output) rule = { topic, transformation, action, output }
            else return
        } else {
            if ('' !== topic && '' !== action) rule = { topic, transformation, action }
            else return
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
            output: ''
        }})
    }

    onDeleteRile(id) {
        this.props.onDelete(id)
    }

    renderNewRule() {
        let complement = null

        if (this.state.values.action === 'republish') {
            complement = <Form.Input name='output' label='Republish topic' value={ this.state.values.output } onChange={ this.onChange.bind(this) } />
        } else if (this.state.values.action === 'enqueue') {
            complement = <Form.Input name='output' label='Queue name' value={ this.state.values.output } onChange={ this.onChange.bind(this) } />
        }

        return (
            <Form size='small'>
                <Form.Group widths='equal'>
                    <Form.Input name='topic'
                        label='Topic'
                        value={ this.state.values.topic }
                        onChange={ this.onChange.bind(this) } />
                    <Form.Input name='transformation'
                        label='Transformation'
                        value={ this.state.values.transformation }
                        disabled
                        onChange={ this.onChange.bind(this) } />
                    <Form.Dropdown name='action'
                        label='Action'
                        placeholder='Select an action'
                        selection
                        value={ this.state.values.action }
                        options={ this.actionOptions() }
                        onChange={ this.onChange.bind(this) } />
                    { complement }
                </Form.Group>
                <Button circular icon='plus' label='Add' color='green' onClick={ this.onFormSubmit.bind(this) } />
            </Form>
        )
    }

    renderRules() {
        const { rules } = this.props
        const items = rules.items.map(r => {

            let actionStep = null

            switch (r.action) {
                case 'discard':
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

                case 'republish':
                    actionStep = (
                        <Step>
                            <Icon name='reply' />
                            <Step.Content>
                                <Step.Title>Republish on topic</Step.Title>
                                <Step.Description>{r.output}</Step.Description>
                            </Step.Content>
                        </Step>
                    )
                    break

                case 'enqueue':
                    actionStep = (
                        <Step>
                            <Icon name='angle double right' />
                            <Step.Content>
                                <Step.Title>Enqueue</Step.Title>
                                <Step.Description>{r.output}</Step.Description>
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
                        <Step disabled={'' === r.transformation}>
                            <Icon name='settings' />
                            <Step.Content>
                                <Step.Title>Transformation</Step.Title>
                                <Step.Description>No transformation</Step.Description>
                            </Step.Content>
                        </Step>
                        { actionStep }
                        <Step>
                            <Step.Content>
                                <Label as='a' color='red' size='tiny' onClick={() => this.onDeleteRile(r.id)}>Delete</Label>
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

        return (
            <Segment raised>
                <Dimmer active={loading} inverted>
                    <Loader inverted />
                </Dimmer>
                <Label color='blue' ribbon>Rules</Label>
                { this.renderRules() }
                { this.renderNewRule() }
            </Segment>
        )
    }

}

Rules.propTypes = {
    rules: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
}

