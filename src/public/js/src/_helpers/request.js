'use strict';

import StateMachine from 'javascript-state-machine'

export class Request {

    constructor() {
        this.requestLimit = 0;
        this.requestCount = 0;

        this.fsm = StateMachine.create({
            initial: 'initial',
            events: [
                { name: 'makerequest',           from: 'initial',      to: 'requesting' },
                { name: 'makerequest',           from: 'refreshing',   to: 'requesting' },
                { name: 'responsereceived',      from: 'requesting',   to: 'ok' },
                { name: 'forbiddenreceived',     from: 'requesting',   to: 'forbidden'    },
                { name: 'unauthorizedreceived',  from: 'requesting',   to: 'unauthorized' },
                { name: 'refreshtoken',          from: 'forbidden',    to: 'refreshing'  },
                { name: 'refreshtoken',          from: 'unauthorized', to: 'refreshing'  },
                { name: 'reset',                 from: 'ok',           to: 'initial' }
            ],
            callbacks: {
                onenterinitial: this.onEnterInitial.bind(this),
                onenterrequesting: this.onEnterRequesting.bind(this),
                onenterforbidden: this.onEnterForbidden.bind(this),
                onenterunauthorized: this.onEnterUnauthorized.bind(this),
                onenterrefreshing: this.onEnterRefreshing.bind(this),
                onenterok: this.onEnterOk.bind(this),
            }
        })
    }

    sendRequest(url, requestOptions) {
        return new Promise((fulfill, reject) => {
            try {
                let req = {
                    url,
                    requestOptions,
                    callback: (err, res) => {
                        if (err) reject(err)
                        else fulfill(res)
                    },
                }
                this.fsm.makerequest(req);

            } catch(err) {
                reject(err);
            }
        });
    }


    onEnterInitial(event, from, to) {
        // console.info(`${from} -> ${to}`);
        this.requestLimit = Request.DEFAULT_REQUEST_LIMIT;
        this.requestCount = 0;
    }

    onEnterRequesting(event, from, to, req) {
        // console.info(`${from} -> ${to}`);

        // call the api
        this.callApi(req)
        .then((res) => {
            this.fsm.responsereceived(req, res);
        })
        .catch((err) => {
            if (this.requestCount > this.requestLimit) {
                console.info('Request limit reached. Returning the response...');
                this.fsm.responsereceived(req, err);
            } else {
                switch (err.status) {
                    case 401:
                        this.fsm.unauthorizedreceived(req);
                        break;
                    case 403:
                        this.fsm.forbiddenreceived(req);
                        break;
                    default:
                        this.fsm.responsereceived(req, err);
                }
            }
        })

        // increment the request count
        this.requestCount++;

        return StateMachine.ASYNC;
    }

    onEnterForbidden(event, from, to, req) {
        // console.info(`${from} -> ${to}`);
        this.requestLimit = Request.FORBIDDEN_REQUEST_LIMIT;
        this.fsm.refreshtokens(req);
    }

    onEnterUnauthorized(event, from, to, req) {
        // console.info(`${from} -> ${to}`);
        this.requestLimit = Request.UNAUTHORIZED_REQUEST_LIMIT;
        this.fsm.refreshtokens(req);
    }

    onEnterRefreshing(event, from, to, req) {
        // console.info(`${from} -> ${to}`);

        // attempt refreshing the token
        this.refreshTokens(req)
        .then((res) => {
            req.token = res.data.token;
            // TODO: store tokens
            this.fsm.makerequest(req);
        })
        .catch((err) => {
            logger.error(`Error obtaining token: ${err.message}`)
            this.fsm.makerequest(req);
        });

        return StateMachine.ASYNC;
    }

    onEnterOk(event, from, to, req, res) {
        // console.info(`${from} -> ${to}`);

        if (res.status === 200 || res.status === 302) {
            req.callback(null, res.body);
        } else {
            req.callback(new Error(res.body));
        }
        this.fsm.reset();
    }

    callApi(req) {
        return new Promise((fulfill, reject) => {

            let uri = req.url;

            logger.info(`Calling ${req.method} ${uri}. Token: ${req.token ? 'yes' : 'no'}`);

            let config = {
                method: req.method,
                uri: uri,
                json: true,
                headers: {
                    'Authorization': `Bearer ${req.token}`
                }
            }

            if (req.method !== 'GET') {
                config.body = req.payload;
            }

            request(config, (err, response, body) => {

                if (err) {
                    reject({ status: null, body: err.message })
                } else {
                    let statusCode = response.statusCode;
                    if (200 === statusCode || 302 === statusCode) {
                        fulfill({ status: statusCode, body: body });
                    } else {
                        let errorMessage = body.message || body.errorMessage || 'Unknown error';
                        reject({ status: statusCode, body: errorMessage });
                    }
                }

            })
        })
    }

    refreshTokens(refreshToken) {
        return new Promise((fulfill, reject) => {

            let uri = '/api/passport/refresh';

            logger.info('Refreshing tokens');

            // TODO
            request(uri)
            }, (err, response, body) => {

                if (err) {
                    reject(err)
                } else {
                    let statusCode = response.statusCode;
                    if (200 === statusCode || 302 === statusCode) {
                        fulfill(body);
                    } else {
                        let errorMessage = body.message || body.errorMessage || body;
                        reject(new Error(errorMessage));
                    }
                }

            });

        });
    }

} // Request

Request.DEFAULT_REQUEST_LIMIT = 3
Request.UNAUTHORIZED_REQUEST_LIMIT = 3
Request.FORBIDDEN_REQUEST_LIMIT = 1
