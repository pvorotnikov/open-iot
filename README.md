# Open IoT

[![Build Status](https://travis-ci.org/pvorotnikov/open-iot.svg?branch=master)](https://travis-ci.org/pvorotnikov/open-iot)
[![Coverage Status](https://coveralls.io/repos/github/pvorotnikov/open-iot/badge.svg)](https://coveralls.io/github/pvorotnikov/open-iot)

Open IoT is intended to be a flexible IoT backend and gateway management system, offering:
* easy and secure data ingestion
* device registry
* data flow management
* simple data transformations
* MQTT and HTTP transports

## How to build and run it locally

```bash
# Using Docker Compose
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

# To run tests with coverage
npm run test:coverage
```

## Configuration
TODO
