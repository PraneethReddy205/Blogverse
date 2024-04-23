const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User=require('../models/user-model');

const likeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const blogSchema = new Schema({
  image: {
    data:Buffer,
    contentType:String
  },
  title: {
    type: String,
    required: true,
  },
  snippet: {
    type: String,  
    required: true,
  },
  body: {
    type: String,
    required: true
  },
  mltags: {
    type: [String]
  },
  htags: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: {
     type: [Schema.Types.ObjectId],
      ref: 'User' ,
      default: []
    },
    comments: [{
      comment: {
        type: String,
        required: true
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;