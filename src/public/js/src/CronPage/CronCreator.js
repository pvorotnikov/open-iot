import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import _ from 'lodash'
import { CronJob } from 'cron'

import { Segment, Button, Label, Form } from 'semantic-ui-react'
import { alertActions, cronActions } from '../_actions'

class CronCreator extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                cron: '0 */5 * * * *',
                type: 'publish',
                topic: '',
                payload: ''
            }
        }
    }

    typeOptions() {
        return [
            { text: 'Publish', value: 'publish' }
        ]
    }

    onChange(e, data) {
        let { name, value } = data
        if ('topic' === name) value = value.trim()
        this.setState({ values: {
            ...this.state.values,
            [name]: value
        }})
    }

    onCronSave() {
        const { dispatch } = this.props
        dispatch(alertActions.clear())
        const cron = {
            cron: this.state.values.cron,
            type: this.state.values.type,
            arguments: {
                topic: this.state.values.topic,
                payload: this.state.values.payload
            }
        }
        dispatch(cronActions.create(cron))
    }

    calculateNextExecution() {
        try {
            const job = new CronJob(this.state.values.cron)
            const next = job.nextDates(5)
            return (
                <ul>
                    { next.map((next, i) => (
                        <li key={i}>{ next.fromNow() } (on { next.format('dddd, MMMM Do YYYY, h:mm:ss a') })</li>
                    )) }
                </ul>
            )
        } catch (err) {
            return <p>There's an error with your cron expression</p>
        }
    }

    render() {

        return (
            <Segment raised color='blue'>
                <Label color='blue' ribbon>Cron Creator</Label>

                <Form size='small' style={{ marginTop: '10px' }}>

                    <Form.Input name='cron'
                        label='Cron'
                        value={ this.state.values.cron }
                        onChange={ this.onChange.bind(this) } />

                    { this.calculateNextExecution() }

                    <Form.Dropdown name='type'
                        label='Type'
                        placeholder='Type'
                        selection
                        value={ this.state.values.type }
                        options={ this.typeOptions() }
                        onChange={ this.onChange.bind(this) } />

                    <Form.Input name='topic'
                        label='Full Topic'
                        value={ this.state.values.topic }
                        onChange={ this.onChange.bind(this) } />

                    <Form.TextArea name='payload'
                        label='Payload (in JSON)'
                        value={ this.state.values.payload }
                        onChange={ this.onChange.bind(this) } />

                    <Button circular
                        icon='save'
                        label='Create'
                        color='green'
                        onClick={ this.onCronSave.bind(this) } />
                </Form>

            </Segment>
        )
    }

}

CronCreator.propTypes = {
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    return { }
}

const connectedCronCreator = connect(mapStateToProps)(withRouter(CronCreator))
export { connectedCronCreator as CronCreator }
