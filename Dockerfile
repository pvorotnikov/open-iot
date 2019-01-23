# -----------------------------------
# Dependencies stage
# This stage is responsible
# for caching production dependencies
# -----------------------------------
FROM node:10-slim AS dependencies
RUN mkdir - /usr/app
COPY ["package.json", "package-lock.json", ".babelrc", "/usr/app/"]
RUN cd /usr/app && npm install --production


# -----------------------------------
# Builder stage
# This stage is responsible
# for building the frontend
# -----------------------------------
FROM node:10-slim AS builder
ENV MONGOMS_VERSION=4.0.5
RUN mkdir -p /usr/app/src/public
COPY --from=dependencies ["/usr/app", "/usr/app/"]
COPY ["src/public", "/usr/app/src/public/"]
RUN cd /usr/app && npm install --unsafe-perm && npm run build


# -----------------------------------
# Runner stage
# -----------------------------------
FROM node:10-slim AS runner

# create application structure from local files and from other stages
RUN mkdir -p /usr/app/src
COPY --from=dependencies ["/usr/app", "/usr/app/"]
COPY --from=builder ["/usr/app/src/public", "/usr/app/src/public/"]
COPY ["src", "/usr/app/src/"]
RUN rm -Rf /usr/app/src/public/js/src

# create entry point
EXPOSE 8080
WORKDIR /usr/app
CMD ["npm", "start"]
