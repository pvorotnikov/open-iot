import React, { Component } from 'react'
import PropTypes from 'prop-types'
import hljs from 'highlight.js'

export class HighlightBlock extends Component {

    constructor(props) {
        super(props)
        this.codeBlock = null
    }

    componentDidMount() {
        hljs.highlightBlock(this.codeBlock)
    }

    componentDidUpdate() {
        hljs.highlightBlock(this.codeBlock)
    }

    render() {
        return (
            <code className={this.props.language}
                ref={el => this.codeBlock = el}
                style={{overflow: 'auto'}}>
                {this.props.children}
            </code>
        )
    }

}

HighlightBlock.propTypes = {
    language: PropTypes.string.isRequired,
}

HighlightBlock.defaultProps = {
    language: 'json',
}
