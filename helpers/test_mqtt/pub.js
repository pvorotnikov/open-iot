const nconf = require('nconf')
nconf.argv().env().defaults({
    BROKER_HOST: null,
    BROKER_PORT: 8883,
    USERNAME: null,
    PASSWORD: null,
    APP_ID: null,
    DEV_ID: null,
})
const mqtt = require('mqtt')

class Client {

    constructor() {
        this.mqttClient = null
    }

    connect(connectedCb) {
        this.mqttClient = mqtt.connect(`mqtts://${nconf.get('BROKER_HOST')}:${nconf.get('BROKER_PORT')}`, {
            username: nconf.get('USERNAME'),
            password: nconf.get('PASSWORD'),
        })
        this.mqttClient.on('connect', () => {
            console.log('MQTT message handler connected')
            if (connectedCb) connectedCb(this.mqttClient)
        })
        this.mqttClient.on('error', err => {
            console.error('MQTT message handler error:', err.message)
        })
        this.mqttClient.on('close', () => {
            console.log('MQTT message handler disconnected')
        })
    }

    publishMessage(e) {
        const { topic, payload } = e
        if (this.mqttClient) {
            this.mqttClient.publish(topic, payload)
            console.log(topic, payload)
        }
    }
}

client = new Client()
client.connect(() => {
    client.publishMessage({
        topic: `${nconf.get('APP_ID')}/${nconf.get('DEV_ID')}/some-topic`,
        payload: JSON.stringify({foo: 'bar'})
    })
})
