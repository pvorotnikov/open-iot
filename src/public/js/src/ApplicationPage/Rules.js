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
            [name]: value
        }})
    }

    onFormSubmit() {
        this.setState({ values: {
            topic: '',
            transformation: '',
            action: null,
            output: ''
        }})
    }

    renderNewRule() {
        let complement = null

        if (this.state.values.action === 'republish') {
            complement = <Form.Input name='output' label='Republish topic' value={ this.state.values.output } onChange={ this.onChange.bind(this) } />
        } else if (this.state.values.action === 'enqueue') {
            complement = <Form.Input name='output' label='Queue name' value={ this.state.values.output } onChange={ this.onChange.bind(this) } />
        }

        return (
            <Form>
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

    render() {
        const { rules } = this.props
        const { loading } = rules

        let items = rules.items.map(r => {
            return (
                <List.Item key={r.id}>{r.id}</List.Item>
            )
        })

        return (
            <Segment raised>
                <Dimmer active={loading} inverted>
                    <Loader inverted />
                </Dimmer>
                <Label color='blue' ribbon>Rules</Label>
                <List>{items}</List>
                { this.renderNewRule() }
            </Segment>
        )
    }

}

Rules.propTypes = {
    rules: PropTypes.object.isRequired,
}

