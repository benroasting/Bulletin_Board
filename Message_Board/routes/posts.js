var express = require('express');
var router = express.Router();
var models = require('../models');
var authService = require("../services/auth");

//GET A POST
router.get('/', function (req, res, next) {
    let token = req.cookies.jwt;
    authService.verifyUser(token)
        .then(user => {
            models.posts.findAll({
                where: {
                    Deleted: false,
                    UserId: user.UserId
                }
            }).then(postsFound => {
                res.render('posts', {
                    posts: postsFound
                });
            });
        })
});

router.post('/', function (req, res, next) {
    let token = req.cookies.jwt;
    authService.verifyUser(token)
        .then(user => {
            models.posts.findOrCreate({
                where: {
                    PostTitle: req.body.PostTitle,
                    PostBody: req.body.PostBody,
                    UserId: user.UserId
                }
            }).spread(function (result, created) {     //What does spread function perform?
                if (created) {
                    res.send('Post successfully created!');
                    res.redirect('posts');
                } else {
                    res.send('Post failed!');
                }
            });
        });
});
//GET A POST BY ID
router.get('/:id', function (req, res, next) {
    const PostId = parseInt(req.params.id);
    let token = req.cookies.jwt;
    authService.verifyUser(token)
        .then(user => {
            if (user) {
                models.posts.findOne({
                    where: {
                        PostId: PostId
                    }
                }).then(foundPost => {
                    if (foundPost) {
                        res.render('onePost', { posts: foundPost });
                    } else {
                        res.status(404).send();
                    }
                });
            } else {
                res.send('Please log in');
            }
        });
});

//DELETE A POST
router.post('/delete/:id', function (req, res, next) {
    let PostId = parseInt(req.params.id);
    let token = req.cookies.jwt;
    authService.verifyUser(token)
        .then(user => {
            if (user) {
                models.posts.update(
                    { Deleted: true },
                    {
                        where: {
                            PostId: PostId,
                            UserId: user.UserId
                        }
                    }
                )
                    .then(result => res.redirect('/profile'))
            };
        });
});

//EDIT A POST
router.post('/editPost/:id', function (req, res, next) {
    let PostId = parseInt(req.params.id);
    let token = req.cookies.jwt;
    authService.verifyUser(token)
        .then(user => {
            if (user) {
                models.posts.update(req.body, { where: { PostId: PostId } })
                    .then(result => res.redirect('/posts'))
                    .catch(err => {
                        res.send("There was a problem updating the post.");
                    });
            } else {
                res.send("You can't edit this post.");
            }
        });
});

module.exports = router;