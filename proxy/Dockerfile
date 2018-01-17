FROM jwilder/nginx-proxy:latest
RUN apt update && apt install net-tools
COPY ["./proxy/nginx.conf", "/etc/nginx/nginx.conf"]
COPY ["./certs", "/etc/nginx/certs"]
