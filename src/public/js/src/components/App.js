import React, { Component } from 'react'

import { Container, Header } from 'semantic-ui-react'


import AddTodo from './AddTodo'
import Footer from './Footer'
import VisibleTodoList from '../containers/VisibleTodoList'

class App extends Component {
    render() {
        return (
            <div>
                <Container style={{ marginTop: '3em' }}>
                    <Header as='h2'>My Todo</Header>
                    <AddTodo />
                    <VisibleTodoList />
                    <Footer />
                </Container>
            </div>
        )
    }
}

export default App
