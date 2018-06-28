#!/bin/bash

APP_ID=5b34e107e22d520032efd2a8
APP_KEY=f0559092
APP_SECRET=96301bba000be3b5
GATEWAY_ID=5b34e113e22d520032efd2a9

mosquitto_pub \
    -h 127.0.0.1 \
    -p 1883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/$GATEWAY_ID/test \
    -m '{"value": 123}' \
    -d
