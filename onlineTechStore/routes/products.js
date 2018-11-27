var express = require('express');
var router = express.Router();
var fs = require('fs-extra');

// Get Product model
var Product = require('../models/product');

// Get CAtegory model
var Category = require('../models/category');
/*
 * GET /
 */
router.get('/all', function (req, res) {
    
    if(req.query.search){
        const regex = new RegExp(escapeRegExp(req.query.search),'gi');
        Product.find({title: regex}, function(err, products){
            if (err)
                console.log(err);

            res.render('all_products', {
                title: "Searched product",
                products: products
            });
            
        });
    }
    else{
        Product.find(function (err, products) {
            if (err)
                console.log(err);

            res.render('all_products', {
                title: "All products",
                products: products
            });
        }); 
    }
    
    
});

router.get('/all/:page', function(req, res, next) {
    console.log("in pagination")
    var perPage = 5
    var page = req.params.page || 1

    Product
        .find()
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, products) {
            Product.count().exec(function(err, count) {
                if (err) return next(err)
                res.render('all_products', {
                    title: "All products",
                    products: products,
                    current: page,
                    pageLength: Math.ceil(count / perPage)
                })
            })
        })
});

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

router.get('/:category', function (req, res) {

    var categorySlug = req.params.category;

    Category.findOne({slug: categorySlug}, function (err, c) {
        searchProducts = [];
        Product.find({category: categorySlug}, function (err, products) {
            if(req.query.search){
                var arr = (products);var k=0;
                const re = new RegExp(escapeRegExp(req.query.search),'gi');
                for (var i = 0, len = arr.length; i < len; i++) {
                      if((re).test(arr[i].title)){
                        searchProducts[k] = (arr[i]);
                        k = k+1;
                      }
                }
                if(searchProducts.length>0)
                    products = searchProducts;
            }
            
            if (err)
                console.log(err);

            res.render('cat_products', {
                title: c.title,
                products: products
            });
        });
    });
    
});


router.get('/:category/:product', function (req, res) {

    var galleryImages = null;
    var loggedIn = (req.isAuthenticated()) ? true : false;

    Product.findOne({slug: req.params.product}, function (err, product) {
        if (err) {
            console.log(err);
        } else {
            var galleryDir = 'public/product_images/' + product._id + '/gallery';

            fs.readdir(galleryDir, function (err, files) {
                if (err) {
                    console.log(err);
                } else {
                    galleryImages = files;

                    res.render('product', {
                        title: product.title,
                        p: product,
                        galleryImages: galleryImages,
                        loggedIn: loggedIn
                    });
                }
            });
        }
    });

});
// Exports
module.exports = router;


