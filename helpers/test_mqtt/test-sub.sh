#!/bin/bash

APP_ID=5a58b8457d6c1b01b01ad4a3
APP_KEY=56e8afe4
APP_SECRET=bdca9f359e280e03
GATEWAY_ID=5a58b8647d6c1b01b01ad4a4

mosquitto_sub \
    -h 127.0.0.1 \
    -p 8883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/tpms2
