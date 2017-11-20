#!/bin/bash

mosquitto_pub -h 127.0.0.1 -p 1883 -u $APP_KEY -P $APP_SECRET -t $APP_ID/$GATEWAY_ID/test -m "test-message"
