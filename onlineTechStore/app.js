var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var session = require('express-session');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var fileUpload=require('express-fileupload');
var passport =require('passport');
mongoose.connect(config.database);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected to mongo");
});


var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs');

app.use(express.static(path.join(__dirname, 'public')));

//body parser middleware

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

//express sessions
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  //cookie: { secure: true }
}));


// Express Validator middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
                , root = namespace.shift()
                , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));


//set global errors
app.locals.errors = null;

// Get Page Model
var Page = require('./models/page');

// Get all pages to pass to header.ejs
Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});


// Get Category Model
var Category = require('./models/category');

// Get all categories to pass to header.ejs
Category.find(function (err, categories) {
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});


//Express fileUpload middleware
app.use(fileUpload());

//express messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//favicon error
app.use( function(req, res, next) {

  if (req.originalUrl && req.originalUrl.split("/").pop() === 'favicon.ico') {
    return res.sendStatus(204);
  }

  return next();

});

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req,res,next) {
   res.locals.cart = req.session.cart;
   res.locals.user = req.user || null;
   next();
});

//set routes
var pages = require('./routes/pages.js');
var products = require('./routes/products.js');
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminProducts = require('./routes/admin_products.js');
var cart = require('./routes/cart.js');
var users = require('./routes/users.js');

app.use('/', pages);
app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products',products);
app.use('/cart',cart);
app.use('/users',users);

var port = 3000;
app.listen(port, function(){
	console.log('Server started on port' + port);
});


