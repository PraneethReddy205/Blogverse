const router = require('express').Router();
const Blog=require('../models/blog');

const authCheck = (req, res, next) => {
    if(!req.user){
        res.redirect('/auth/login');
    } else {
        next();
    }
};



router.get('/',(req, res) => {
    Blog.find().sort({createdAt:-1}).populate('author') 
    .then((result)=>{
        res.render('home',{user: req.user,title:'All blogs', blogs: result});
      })
      .catch((err)=>{
        console.log(err); 
      });
});



module.exports = router;