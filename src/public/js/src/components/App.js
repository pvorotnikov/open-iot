import React, { Component } from 'react'

import { Grid, Segment, Container, Header } from 'semantic-ui-react'

import LoginForm from './LoginForm'
import AddTodo from './AddTodo'
import Footer from './Footer'
import VisibleTodoList from '../containers/VisibleTodoList'

class App extends Component {
    render() {
        return (
            <div>
                <Container style={{ marginTop: '3em' }}>

                    <Grid columns='equal'>
                        <Grid.Column>
                            <LoginForm />
                        </Grid.Column>
                        <Grid.Column>
                            <Segment>
                                <Header as='h2'>My Todo</Header>
                                <AddTodo />
                                <VisibleTodoList />
                                <Footer />
                            </Segment>
                        </Grid.Column>
                    </Grid>
                </Container>
            </div>
        )
    }
}

export default App
