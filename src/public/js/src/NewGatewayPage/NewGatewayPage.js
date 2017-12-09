import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Header, Container, Segment, Icon, Button, Form, Dimmer, Loader } from 'semantic-ui-react'

import { gatewayActions } from '../_actions'

class NewGatewayPage extends Component {

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
        const application = this.props.match.params.id
        if (name && description) {
            this.props.dispatch(gatewayActions.create({ application, name, description }, this.props.history))
        }
    }

    render() {
        const { history } = this.props
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='lab' circular />
                    <Header.Content>Create Gateway</Header.Content>
                </Header>
                <Segment>
                    <Dimmer active={this.props.loading} inverted>
                        <Loader inverted />
                    </Dimmer>
                    <Form>
                        <Form.Input label="Gateway name" name="name" onChange={(e, d) => this.onChange(e, d)} />
                        <Form.TextArea label="Gateway description" name="description" onChange={(e, d) => this.onChange(e, d)} />
                        <Button circular icon='plus' label='Create' color='green' onClick={ e => this.onSubmit(e) } />
                        <Button circular floated='right' icon='chevron left' label='Cancel' color='orange' onClick={ e => history.goBack() } />
                    </Form>

                </Segment>
            </Container>
        )
    }
}

NewGatewayPage.propTypes = {
    loading: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    const { gateways } = state
    const { loading } = gateways
    return {
        loading,
    }
}

const connectedNewGatewayPage = connect(mapStateToProps)(withRouter(NewGatewayPage))
export { connectedNewGatewayPage as NewGatewayPage }
