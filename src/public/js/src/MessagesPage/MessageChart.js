import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, } from 'recharts'
import moment from 'moment'
import isEqual from 'lodash/isEqual'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'


class MessageChart extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        const stateIsEqual = isEqual(this.state, nextState)
        const propsIsEqual = isEqual(this.props, nextProps)
        return !stateIsEqual || !propsIsEqual
    }

    render() {

        const { chartData } = this.props
        if (!chartData.length) {
            return null
        }

        // last 24 hours
        // const start = moment().subtract(1, 'day').valueOf()
        const start = chartData[0].time
        const end = moment().valueOf()

        return (

                <ResponsiveContainer width='100%' height={100}>
                    <BarChart data={chartData}>
                        <XAxis dataKey='time'
                            domain={[ start, end ]}
                            scale='utc'
                            type='number'
                            name='Hour'
                            tickFormatter={time => moment(time).format('HH:mm')} />
                        <Tooltip labelFormatter={time => moment(time).format('HH:mm')} />
                        <Bar dataKey='count' fill='#8884d8' />
                    </BarChart>
                </ResponsiveContainer>

        )
    }

    static aggregateData(chartData, aggregate = 5) {
        const aggregateBoundary = aggregate * 60 * 1000
        let groupTime = chartData[0] + aggregateBoundary
        const groupedData = groupBy(chartData, time => {
            return time - groupTime <= aggregateBoundary ? groupTime : groupTime = time;
        })
        return map(groupedData, (value, key) => (
            { time: parseInt(key), count: value.length }
        ))
    }

    static mapChartData(data) {
        if (!data || !data.length) return []
        let arr = data.map(entry => new Date(entry.created).getTime())
        arr.reverse()
        return MessageChart.aggregateData(arr, 5)
    }

}

MessageChart.propTypes = {
    dispatch: PropTypes.func.isRequired,
    chartData: PropTypes.array,
    loading: PropTypes.bool,
}

function mapStateToProps(state) {
    return {
        chartData: MessageChart.mapChartData(state.persistency.items),
        loading: state.persistency.loading
    }
}

const connectedMessageChart = connect(mapStateToProps)(MessageChart)
export { connectedMessageChart as MessageChart }
