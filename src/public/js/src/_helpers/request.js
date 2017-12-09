import StateMachine from 'javascript-state-machine'

export class Request {

    constructor(forceLogoutOnAuthError=true) {
        this.forceLogoutOnAuthError = forceLogoutOnAuthError
        this.requestLimit = 0
        this.requestCount = 0

        this.fsm = StateMachine.create({
            initial: 'initial',
            events: [
                { name: 'makerequest',           from: 'initial',      to: 'requesting'   },
                { name: 'makerequest',           from: 'refreshing',   to: 'requesting'   },
                { name: 'responsereceived',      from: 'requesting',   to: 'ok'           },
                { name: 'forbiddenreceived',     from: 'requesting',   to: 'forbidden'    },
                { name: 'unauthorizedreceived',  from: 'requesting',   to: 'unauthorized' },
                { name: 'refreshtoken',          from: 'forbidden',    to: 'refreshing'   },
                { name: 'refreshtoken',          from: 'unauthorized', to: 'refreshing'   },
                { name: 'reset',                 from: 'ok',           to: 'initial'      }
            ],
            callbacks: {
                onenterinitial: this.onEnterInitial.bind(this),
                onenterrequesting: this.onEnterRequesting.bind(this),
                onenterforbidden: this.onEnterForbidden.bind(this),
                onenterunauthorized: this.onEnterUnauthorized.bind(this),
                onenterrefreshing: this.onEnterRefreshing.bind(this),
                onenterok: this.onEnterOk.bind(this)
            }
        })
    }

    send(url, requestOptions) {
        return new Promise((fulfill, reject) => {
            try {
                let req = {
                    url,
                    requestOptions,
                    callback: (err, res) => {
                        if (err) reject(err.message)
                        else fulfill(res.data)
                    },
                }
                this.fsm.makerequest(req)
            } catch(err) {
                reject(err.message)
            }
        })
    }

    getAccessToken() {
        let user = JSON.parse(localStorage.getItem('user'))
        if (user && user.accessToken) {
            return user.accessToken
        } else {
            return null
        }
    }

    getRefreshToken() {
        let user = JSON.parse(localStorage.getItem('user'))
        if (user && user.refreshToken) {
            return user.refreshToken
        } else {
            return null
        }
    }

    onEnterInitial(event, from, to) {
        // console.warn(`${from} -> ${to}`)
        this.requestLimit = Request.DEFAULT_REQUEST_LIMIT
        this.requestCount = 0
    }

    onEnterRequesting(event, from, to, req) {
        // console.warn(`${from} -> ${to}`)

        // send the request
        this.sendRequest(req)

        // handle success
        .then(res => {
            this.fsm.responsereceived(req, res);
        })

        // handle error
        .catch(err => {

            // on limit reached, process the response
            if (this.requestCount > this.requestLimit) {
                console.info('Request limit reached. Returning the response...')
                this.fsm.responsereceived(req, err)

                // force logout
                if (this.forceLogoutOnAuthError) {
                    localStorage.removeItem('user')
                }

            } else {
                switch (err.status) {
                    // threat 401 as unauthorized
                    case 401:
                        this.fsm.unauthorizedreceived(req)
                        break
                    // treat 403 as forbidden
                    case 403:
                        this.fsm.forbiddenreceived(req)
                        break
                    // treat everything else as response
                    default:
                        this.fsm.responsereceived(req, err)
                }
            }
        })

        // increment the request count
        this.requestCount++

        return StateMachine.ASYNC
    }

    onEnterForbidden(event, from, to, req) {
        // console.warn(`${from} -> ${to}`)
        this.requestLimit = Request.FORBIDDEN_REQUEST_LIMIT
        this.fsm.refreshtoken(req)
    }

    onEnterUnauthorized(event, from, to, req) {
        // console.warn(`${from} -> ${to}`)
        this.requestLimit = Request.UNAUTHORIZED_REQUEST_LIMIT
        this.fsm.refreshtoken(req)
    }

    onEnterRefreshing(event, from, to, req) {
        // console.warn(`${from} -> ${to}`)

        // attempt refreshing the token
        this.refreshTokens()
        .then((res) => {

            // store new set of tokens
            let user = JSON.parse(localStorage.getItem('user'))
            user = {...user, accessToken: res.accessToken, refreshToken: res.refreshToken }
            localStorage.setItem('user', JSON.stringify(user))

            // repeat the request
            this.fsm.makerequest(req)
        })
        .catch((err) => {
            console.warn(`Error refreshing token: ${err.message}`)
            this.fsm.makerequest(req);
        });

        return StateMachine.ASYNC;
    }

    onEnterOk(event, from, to, req, res) {
        // console.warn(`${from} -> ${to}`);
        if (res.ok) {
            req.callback(null, res.body);
        } else {
            req.callback(new Error(res.body));
        }
        this.fsm.reset();
    }

    sendRequest(req) {
        return new Promise((fulfill, reject) => {

            let token = this.getAccessToken()
            if (token) {
                req.requestOptions.headers = { ...req.requestOptions.headers, Authorization: 'Bearer ' + token }
            }

            console.debug(`Calling ${req.requestOptions.method} ${req.url}`);
            console.debug('Request options', req.requestOptions)

            fetch(req.url, req.requestOptions)
            .then(response => {
                if (!response.ok) {
                    response.json()
                    .then(res => {
                        reject({ ok: response.ok, status: response.status, body: res.errorMessage || response.statusText })
                    })
                    .catch(err => {
                        reject({ ok: response.ok, status: response.status, body: err.message })
                    })
                } else {
                    response.json()
                    .then(res => {
                        fulfill({ ok: response.ok, status: response.status, body: res })
                    })
                    .catch(err => {
                        reject({ ok: response.ok, status: response.status, body: err.message })
                    })
                }
            })
        })
    }

    refreshTokens() {
        return new Promise((fulfill, reject) => {

            const token = this.getRefreshToken()
            const url = '/api/passport/refresh'
            const requestOptions = {
                method: 'GET',
                headers: { Authorization: 'Bearer ' + token },
            }

            console.debug(`Calling ${requestOptions.method} ${url}`);
            console.debug('Request options', requestOptions)

            fetch(url, requestOptions)
            .then(response => {
                if (!response.ok) {
                    response.json()
                    .then(res => {
                        reject(new Error(res.errorMessage || response.statusText))
                    })
                    .catch(err => {
                        reject(new Error(err.message))
                    })
                } else {
                    response.json()
                    .then(res => {
                        fulfill(res.data)
                    })
                    .catch(err => {
                        reject(new Error(err.message))
                    })
                }
            })
        })
    }

} // Request

Request.DEFAULT_REQUEST_LIMIT = 3
Request.UNAUTHORIZED_REQUEST_LIMIT = 3
Request.FORBIDDEN_REQUEST_LIMIT = 1
