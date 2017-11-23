#!/bin/bash

APP_ID=5a16981e3962fe001e0c2992
APP_KEY=61964572
APP_SECRET=872947ac94038e01

mosquitto_pub \
    -h 127.0.0.1 \
    -p 8883 \
    -u $APP_KEY \
    -P $APP_SECRET \
    -t $APP_ID/message \
    -m "test-message" \
    --insecure \
    -d
    # --cafile ../broker/certs/ca_certificate.pem \
    # --cert ../broker/certs/client_certificate.pem \
    # --key ../broker/certs/client_key.pem \
