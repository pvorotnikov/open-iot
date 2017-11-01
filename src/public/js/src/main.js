import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Rating } from 'semantic-ui-react'

class App extends Component {
    render() {
        return (<Rating rating={1} maxRating={10} />)
    }
}

ReactDOM.render(<App />, document.getElementById('root'))
