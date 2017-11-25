#!/bin/bash

APP_ID=5a191aed6c00ae001cf59cfe
APP_KEY=225a025b
APP_SECRET=b94f88cb8cff60d8

mosquitto_pub \
    -h 127.0.0.1 \
    -p 8883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/message \
    -m "test-message" \
    -d
