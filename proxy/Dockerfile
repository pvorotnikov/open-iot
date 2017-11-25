FROM jwilder/nginx-proxy:latest
RUN apt update && apt install net-tools
COPY ["./proxy/dev.conf", "/etc/nginx/nginx.conf"]
