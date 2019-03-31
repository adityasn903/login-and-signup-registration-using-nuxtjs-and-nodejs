const mongoose = require('mongoose');
//const jwt = require('jsonwebtoken');
const _ = require('lodash');
let date = require('date-and-time');

var postsSchema = new  mongoose.Schema({
    authorName: {
        type: String
    },
    postTitle: {
      type: String
    },
    postDescription: {
        type:String,
    }
    ,
    postedDate:{
        type: Date
    }
})

var posts = mongoose.model('posts',postsSchema);

module.exports = {posts};