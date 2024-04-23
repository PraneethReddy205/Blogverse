const express = require('express');
const router = require('express').Router();
const passport = require('passport');
const Blog=require('../models/blog');

// auth with google+
router.get('/google', passport.authenticate('google', {
    scope: ['profile','email'],

}));

// callback route for google to redirect to
// hand control to passport to use code to grab profile info
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    //res.send(req.user);
    res.redirect('/');
});

// auth login
router.get('/login', (req, res) => {
    
    Blog.find().sort({createdAt:-1}).populate('author') 
    .then((result)=>{
        res.render('home',{user:req.user, blogs: result}); 
      })
      .catch((err)=>{
        console.log(err); 
      });
});

// auth logout
router.get('/logout', (req, res) => {
    // handle with passport
    req.logout();
    res.redirect('/');
});


module.exports = router;  