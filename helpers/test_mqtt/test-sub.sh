#!/bin/bash

GATEWAY_ID=5a15d05cd5f7dd001c5b58cf
APP_ID=5a15cf2bd5f7dd001c5b58ce
APP_KEY=fa438d04
APP_SECRET=6acea6779fbfd3f8

# mosquitto_pub -h iot.vorotnikov.net -p 1883 -u $APP_KEY -P $APP_SECRET -t $APP_ID/$GATEWAY_ID/test -m "test-message"
mosquitto_sub -h iot.vorotnikov.net -p 1883 -u $APP_KEY -P $APP_SECRET -t $APP_ID/$GATEWAY_ID/test
