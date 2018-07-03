#!/bin/bash

APP_ID=5b3b1fca4b13e300323ef12e
APP_KEY=cda978db
APP_SECRET=7bd35142c115d0d6
GATEWAY_ID=5b3b1fd64b13e300323ef12f

mosquitto_pub \
    -h 127.0.0.1 \
    -p 1883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/$GATEWAY_ID/test \
    -m '{"value": 123}' \
    -q 1 \
    -d
