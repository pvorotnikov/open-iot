const passport = (state = 'SHOW_ALL', action) => {

    switch (action.type) {

        case 'LOGIN':
            console.log('Calling login', action)
            return state

        default:
            return state
    }

}

export default passport
