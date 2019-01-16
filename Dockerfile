FROM node:10

# ----------------------
# create application structure
# ----------------------
RUN mkdir -p /usr/app/src

# ----------------------
# install dependencies
# create caching layer
# ----------------------
COPY ["package.json", "package-lock.json", ".babelrc", "/usr/app/"]
COPY ["src", "/usr/app/src/"]
RUN cd /usr/app && npm install --unsafe-perm
RUN cd /usr/app && npm run build

# ----------------------
# create entry point
# ----------------------
EXPOSE 8080
WORKDIR /usr/app
CMD ["npm", "start"]
