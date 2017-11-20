#!/bin/bash

GATEWAY_ID=5a1143ee66d6ad00916a3b43
APP_ID=5a0ed4e156a8ff0027a3c371
APP_KEY=a5239c30
APP_SECRET=4dc7ba21b706705a

curl -u $APP_KEY:$APP_SECRET -H "content-type:application/json" -XPOST -d '{"test":123}' http://127.0.0.1:8080/api/publish/$APP_ID/$GATEWAY_ID/compound/topic
