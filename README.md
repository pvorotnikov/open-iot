# Open IoT
Open IoT is intended to be a flexible IoT backend and gateway management system, offering:
* easy and secure data ingestion
* device registry
* data flow management
* simple data transformations
* MQTT and HTTP transports

## How to build and run it locally

```bash
# To build all images
docker-compose up -d --build
```

## Building, testing and development

```bash
# To build the frontend only once
npm run build

# To continuously watch for changes on the frontend
npm run watch

# To follow the logs of the backend
docker logs -f openiot_ui_1

# To run tests
npm test
```

## Configuration
TODO

### Reference reading material
* http://sandboxelectronics.com/?product=lorago-dock-single-channel-lorawan-gateway
* https://www.slideshare.net/MemSQL/building-the-ideal-stack-for-realtime-analytics
* http://www.instructables.com/id/Use-Lora-Shield-and-RPi-to-Build-a-LoRaWAN-Gateway/
* https://www.thethingsnetwork.org/wiki/Backend/Home
* https://github.com/TheThingsNetwork
* http://jasonwatmore.com/post/2017/09/16/react-redux-user-registration-and-login-tutorial-example
* https://medium.com/@stowball/a-dummys-guide-to-redux-and-thunk-in-react-d8904a7005d3
* https://www.mockapi.io/

### Quirks
* https://github.com/babel/babel/issues/6424
