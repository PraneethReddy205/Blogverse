const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');
const passportCookie = require('passport-cookie');
const session = require('express-session');
const bodyParser = require('body-parser');
const morgan=require('morgan');
const authRoutes = require('./routes/auth-routes');
const homeRoutes = require('./routes/home-routes');
const passportSetup = require('./config/passport-setup');
const mongoose = require('mongoose');
const keys = require('./config/keys');   
const path=require('path');
const Blog=require('./models/blog');
const User=require('./models/user-model');
const multer=require('multer');
const fs = require('fs'); 
const methodOverride = require('method-override');
let {PythonShell} = require('python-shell');
const app = express(); 


// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer upload 
const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }
}).single('image');

mongoose.set('strictQuery', true);

// set view engine
app.set('view engine', 'ejs');
app.set('views', './views');


// set up session cookies
app.use(cookieSession({
    name:'session',
    maxAge: 24 * 60 * 60 * 1000,
    resave: false,
    saveUninitialized: false,
    keys: [keys.session.cookieKey] 
}));

app.use(session({
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: true
}));

module.exports = {
  app: app,
  session: cookieSession
};
 
// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// set up passport-cookie middleware
passport.use(new passportCookie.Strategy({
  cookieName: 'session',
  secret: keys.session.cookieSecret
}, (token, done) => {
  // deserialize user from token
  // make sure to handle errors appropriately
  User.findById(token.id, (err, user) => {
    if (err) { return done(err); }
    if (!user) { return done(null, false); } 
    return done(null, user);
  });
}));

// connect to mongodb
mongoose.connect(keys.mongodb.dbURI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully"); 
}); 

//app configuration and middleware
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
 
// set up routes
app.use('/auth', authRoutes);  
app.use('/', homeRoutes);

// create home routes
app.get('/', (req, res) => {
    res.redirect('/home');
});
app.get('/about', (req,res)=>{
    res.render('about',{user: req.user});
});

app.get('/write', (req,res)=>{
    res.render('write',{user: req.user});
});

app.get('/home',async(req,res)=>{ 
  try {
    const result = await Blog.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $addFields: {
          likesCount: { $size: '$likes' }
        }
      },
      {
        $sort: { createdAt: -1, likesCount: -1 }
      }
    ]);
    res.render('home', { user: req.user, title: 'Home', blogs: result });
  } catch (err) {
    console.log(err);
  }
}); 

app.get('/search', async (req, res) => {
  const query = req.query.q; // Get the search query from the URL query string
  try {
    const blogs = await Blog.find({
      $or: [
        { mltags: { $regex: new RegExp(query, 'i') } }, 
        { htags: { $regex: new RegExp(query, 'i') } }
      ]
    })
    .populate('author') 
    .sort({ likes: -1, createdAt: -1 }); // Perform the tag search using the $regex operator and also sort them on basis of likes and date
    res.render('search', { blogs, query, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

app.post('/generateTags', ensureAuth, (req, res) => {
  const  body  = req.body.body;
  let keywords = "";
// Run the Python script to generate tags
  let options = {
    mode: 'text',
    pythonPath: 'C:/Users/koushik/AppData/Local/Programs/Python/Python311/python.exe',
    pythonOptions: ['-u'], 
    // scriptPath: 'C:/Users/koushik/Documents/OAuth/',  
    args: [body],
  };

let pyshell = new PythonShell('key.py');

pyshell.send(JSON.stringify(body)); 

pyshell.on('message', function (message) {
  // received a message sent from the Python script
  //console.log(message);
  keywords += message;
});


pyshell.end(function (err,code,signal) {
  if (err) {
    console.log(err);
    res.status(500).send("Error running key.py"); 
  } else {

// remove square brackets
const keywordsWithoutBrackets = keywords.replace(/[\[\]]+/g, '');

// remove single quotes
const keywordsWithoutQuotes = keywordsWithoutBrackets.replace(/'/g, '');
let finalkeywords = keywordsWithoutQuotes.replace(/\s+/g, '');
    let keywordsArr = finalkeywords.split(",");
    req.session.keywords = keywordsArr;
    res.json({ keywords: finalkeywords });
  }
});
  
});

// Route to upload image
app.post('/home', upload, async (req, res) => {  
  const { title, snippet, body,tags } = req.body;
  let finaltags = tags.replace(/\s+/g, '');
    let tagArr = finaltags.split(",");
  const { filename, mimetype, path } = req.file; 
  const blog = new Blog({
    title: title,
    snippet: snippet,
    body: body,
    htags:tagArr,
    author:req.user._id,
    createdAt: new Date,
    image: {
      data: await new Promise((resolve, reject) => { 
        fs.readFile(path, (err, data) => {
          if (err) reject(err); 
          resolve(data);  
        });
      }), 
      contentType: mimetype 
    }, 
    mltags: req.session.keywords
  });
  delete req.session.keywords;
  try {
    await blog.save();
    delete req.session.keywords;
    res.redirect('/');
  } catch (err) {
    console.log(err);
    
  }
});


app.get('/home/:id',(req,res)=>{  
    const id=req.params.id;
    Blog.findById(id).populate('author comments.author')
        .then((result)=>{
          res.render('article',{user: req.user, blog:result,title:'Blog Details'});
        })
        .catch((err)=>{
        console.log(err);
        });
});

const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

app.delete('/home/:id', isAdmin, async (req, res) => {
  try {
    const id=req.params.id;
    await Blog.findByIdAndDelete(id);
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.render('errors/500');  
  } 
});


//Readlater
app.post('/home/:id/readlater', ensureAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    const user = await User.findById(req.user._id);
    if (user.readLater && user.readLater.includes(blog._id)) {
      user.readLater.pull(blog._id);
    } else {
      if (!user.readLater) {
        user.readLater = []; 
      } 
      user.readLater.push(blog._id);
    }
    await user.save();  
    res.json({ isReadLater: user.readLater.includes(blog._id) });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Server error' });
  }
});
app.get('/readlater', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'readLater',
        populate: {
          path: 'author',
          select: 'username thumbnail'
        }
      });
    res.render('readlater', { user });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});
  

// Like a blog post
app.post('/home/:id/likes', ensureAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) { 
      return res.status(404).send({ error: 'Blog not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    if (blog.likes && blog.likes.includes(user._id)) {
      blog.likes.pull(user._id);
    } else {
      if (!blog.likes) {
        blog.likes = [];
      }
      blog.likes.push(user._id); 
    }

    await blog.save();

    // Return the updated likes count 
    const isLiked = blog.likes.includes(user._id);
    const likesCount = blog.likes.length;
    res.status(200).send({ isLiked, likesCount });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Server error' });
  }
});

//Comment
app.post('/home/:id/comment', ensureAuth, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  const { comment } = req.body;
  const author = req.user._id;
  blog.comments.push({ comment, author });
  await blog.save();
  res.redirect(`/home/${blog._id}`);
});

//my blogs
app.get('/myblogs', ensureAuth, async (req, res) => {
  try {
    const authorId = req.user._id;
    const blogs = await Blog.find({ author: authorId }).sort({ createdAt: 'desc' }).lean();
    res.render('myblogs', { blogs: blogs ,user: req.user});
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});
app.get('/myblogs/:id', ensureAuth,(req,res)=>{ 
  const id=req.params.id;
  Blog.findById(id)
      .then((result)=>{
        res.render('deledit',{user: req.user, blog:result,title:'delete&edit'});
      })
      .catch((err)=>{
      console.log(err);
      });
});
// Delete blog
app.delete('/myblogs/:id', ensureAuth, async (req, res) => {
  try {
    const id=req.params.id;
    await Blog.findByIdAndDelete(id);
    res.redirect('/myblogs');
  } catch (err) {
    console.error(err);
    res.render('errors/500'); 
  } 
});
// Update blog post
app.put('/myblogs/:id', ensureAuth, async (req, res) => {
  try {
    const { title,snippet, body } = req.body;
    await Blog.findByIdAndUpdate(req.params.id, { title,snippet, body });
    res.redirect('/myblogs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error'); 
  } 
});

app.listen(27017, () => { 
    console.log('app now listening for requests on port 27017');
});  