#!/bin/bash

APP_ID=5a5cb6016dc0fc0036aebdc6
APP_KEY=22fb3c0f
APP_SECRET=c7bc6d6efd646c6a
GATEWAY_ID=5a5cb6d96dc0fc0036aebdc8

mosquitto_sub \
    -h 127.0.0.1 \
    -p 8883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/message
