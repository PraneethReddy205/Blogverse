//add this file to .gitignore

module.exports={
    google:{
        clientID:'<client id>',
        clientSecret:'<client secret>',
        callbackURL: 'http://localhost:3000/auth/google/callback'
    },
    mongodb:{
        dbURI:'<mongodb connecting string>'
    },
    session:{
        cookieKey:'theblogzisawesome',
        cookieSecret:'blogit'
    }
}    
