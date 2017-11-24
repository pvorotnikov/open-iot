#!/bin/bash

APP_ID=5a17d4cc9912b8001e670ca6
APP_KEY=d976b8d0
APP_SECRET=409343564cc8b2e0

mosquitto_pub \
    -h 127.0.0.1 \
    -p 1883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/message \
    -m "test-message" \
    -d
