#!/bin/bash

echo -e "Sleeping for 10 seconds to allow broker to start..."
sleep 10
echo -e "Starting Nginx..."
/app/docker-entrypoint.sh forego start -r
