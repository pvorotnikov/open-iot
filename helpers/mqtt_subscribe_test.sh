#!/bin/bash

GATEWAY_ID=5a1143ee66d6ad00916a3b43
APP_ID=5a069b2e6ab5320066cc2d6f
APP_KEY=64ba3f86
APP_SECRET=decb0af572081bd2

mosquitto_sub -h 127.0.0.1 -p 1883 -u $APP_KEY -P $APP_SECRET -t $APP_ID/+/test_topic
