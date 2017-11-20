#!/bin/bash

curl -u $APP_KEY:$APP_SECRET -H "content-type:application/json" -XPOST -d '{"test":123}' http://127.0.0.1:8080/api/publish/$APP_ID/$GATEWAY_ID/test
