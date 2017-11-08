import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Header, Container, Segment, Icon, Button, Form } from 'semantic-ui-react'

import { appActions } from '../_actions'
import { history } from '../_helpers'

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
        const { name, description } = this.state.values;
        if (name && description) {
            this.props.dispatch(appActions.create({ name, description }));
        }
    }

    render() {
        return (
            <Container>
                <Header as='h1'>
                    <Icon name='lab' circular />
                    <Header.Content>Create Application</Header.Content>
                </Header>
                <Segment>
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
    dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
    return {}
}

const connectedNewApplicationPage = connect(mapStateToProps)(NewApplicationPage)
export { connectedNewApplicationPage as NewApplicationPage }
