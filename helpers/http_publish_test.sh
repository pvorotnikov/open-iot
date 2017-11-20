#!/bin/bash

GATEWAY_ID=5a12cc1b7b115803e1c0fe41
APP_ID=5a12caab1d285c03d46994ac
APP_KEY=2ba343c8
APP_SECRET=c3af48947e4c5323

curl -u $APP_KEY:$APP_SECRET -H "content-type:application/json" -XPOST -d '{"test":123}' http://127.0.0.1:8080/api/publish/$APP_ID/$GATEWAY_ID/test
