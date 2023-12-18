const mqtt = require('mqtt');


const protocol = 'mqtt'
const host = '172.26.10.138'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const connectUrl = `${protocol}://${host}:${port}`

const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: '',
    password: '',
    reconnectPeriod: 1000,
})

client.on('connect', () => {
    console.log('MQTT đã kết nối!')
})



module.exports = client;