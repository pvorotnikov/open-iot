import React, { Component } from 'react'

import {
  Button, Container, Grid, Header, Icon, Image, Item, Label, Menu, Segment, Step, Table,
} from 'semantic-ui-react'


import AddTodo from './AddTodo'
import Footer from './Footer'
import VisibleTodoList from '../containers/VisibleTodoList'

class App extends Component {
    render() {
        return (
            <div>
                <AddTodo />
                <VisibleTodoList />
                <Footer />
            </div>
        )
    }
}

export default App
