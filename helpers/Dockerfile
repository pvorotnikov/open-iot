FROM node:8

# ----------------------
# create application structure
# ----------------------
RUN mkdir -p /usr/app/src

# ----------------------
# install dependencies
# create caching layer
# ----------------------
COPY ["package.json", "package-lock.json", "/usr/app/"]
COPY ["src", "/usr/app/src/"]
RUN cd /usr/app && npm install

# ----------------------
# create entry point
# ----------------------
EXPOSE 8080
WORKDIR /usr/app
CMD ["npm", "start"]
