import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { Header, Container, Segment, Icon, Button, Form, Dimmer, Loader } from 'semantic-ui-react'

import { appActions } from '../_actions'

class NewApplicationPage extends Component {

    constructor(props) {
        super(props)

        this.state = {
            values: {
                name: '',
                description: ''
            }
        }
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
        if (name && description) {
            this.props.dispatch(appActions.create({ name, description }, this.props.history))
        }
    }

    render() {
        const { history } = this.props
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='lab' circular />
                    <Header.Content>Create Application</Header.Content>
                </Header>
                <Segment>
                    <Dimmer active={this.props.loading} inverted>
                        <Loader inverted />
                    </Dimmer>
                    <Form>
                        <Form.Input label="Application name" name="name" onChange={(e, d) => this.onChange(e, d)} />
                        <Form.TextArea label="Application description" name="description" onChange={(e, d) => this.onChange(e, d)} />
                        <Button circular icon='plus' label='Create' color='green' onClick={ e => this.onSubmit(e) } />
                        <Button circular floated='right' icon='chevron left' label='Cancel' color='orange' onClick={ e => history.goBack() } />
                    </Form>

                </Segment>
            </Container>
        )
    }
}

NewApplicationPage.propTypes = {
    loading: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { apps } = state
    const { loading } = apps
    return {
        loading,
    }
}

const connectedNewApplicationPage = connect(mapStateToProps)(withRouter(NewApplicationPage))
export { connectedNewApplicationPage as NewApplicationPage }
