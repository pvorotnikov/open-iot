#!/bin/bash

APP_ID=5a5890807d6c1b01b01ad49d
APP_KEY=9122d97d
APP_SECRET=0f027c9e206d4d7a
GATEWAY_ID=5a58909b7d6c1b01b01ad49e

mosquitto_pub \
    -h 127.0.0.1 \
    -p 8883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/$GATEWAY_ID/tpms/fl \
    -m '{"value": 123}' \
    -d
