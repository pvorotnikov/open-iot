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

## Deployment

1. Generate SSL certificates for your domain.
* Place the server private key in `server_key.pem` file
* Place the certificate chain of the server certificate and the root certificate by inserting them one after another (in that order) in `server_certificate.pem` file.
* Copy the two files in a psersistent directory on the docker host and create symlinks with the domain name (note that the names are important):
    * `/certs/server_certificate.pem`
    * `/certs/iot.example.com.crt -> /certs/server_certificate.pem`
    * `/certs/server_key.pem`
    * `/certs/iot.example.com.key -> /certs/server_key.pem`

2. Copy `docker-compose-prod.yml` to your host as `docker-compose.yml` and update it by changing the following fields:
* `services.proxy.volumes[1] = /certs:/etc/nginx/certs/`
* `services.broker.environment.RABBITMQ_ERLANG_COOKIE = cookie_secret`
* `services.ui.environment.VIRTUAL_HOST = iot.example.com`
* `services.ui.environment.DB_CONNECTION = mongodb://db/prod`
* `services.ui.environment.ENCRYPTION_SECRET = encryption_secret`
* `services.ui.environment.HANDLER_KEY = handler_key`
* `services.ui.environment.HANDLER_SECRET = handler_secret`

3. (Optional) Add MongoDB service to composition. Don't forget to mount a persistent directories on the docker host as `/data/db` and `/data/configdb` volumes in the Mongo container:
```yaml
db:
    image: mongo:latest
    ports:
        - 27017:27017
    hostname: db
    volumes:
        - /path/to/mongodb/data/db:/data/db
        - /path/to/mongodb/data/configdb:/data/configdb
```

4. Run `docker-compose up -d`

### How to update

Create a `redeploy.sh` script next to docker-compose.yml with the following contents:

```bash
#!/bin/bash
docker pull pvorotnikov/open-iot-proxy:latest
docker pull pvorotnikov/open-iot-broker:latest
docker pull pvorotnikov/open-iot-ui:latest
docker-compose up -d
```

Run it every time you need to update the service
