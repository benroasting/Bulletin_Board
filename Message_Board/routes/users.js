var express = require('express');
var router = express.Router();
var models = require('../models');
const authService = require("../services/auth");

//SIGN-UP
router.get('/signup', function (req, res, next) {
  res.render('signup');
});

router.post('/signup', function (req, res, next) {
  models.users.findOrCreate({
    where: { Username: req.body.username },
    defaults: {
      FirstName: req.body.firstName,
      LastName: req.body.lastName,
      Email: req.body.email,
      Password: authService.hashPassword(req.body.password)
    }
  }).spread(function (result, created) {
    if (created) {
      res.redirect('login');
    } else {
      res.send("User already exists");
    }
  });
});

//LOGIN
router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/login', function (req, res, next) {
  models.users.findOne({
    where: {
      Username: req.body.username
    }
  }).then(user => {
    if (!user) {
      console.log('User not found')
      return res.status(401).json({
        message: "Login Failed"
      });
    }
    if (user) {
      let passwordMatch = authService.comparePasswords(req.body.password, user.Password);
      if (passwordMatch) {
        let token = authService.signUser(user); // <--- Uses the authService to create jwt token
        res.cookie('jwt', token); // <--- Adds token to response as a cookie
        res.redirect('profile');
      } else
        res.send('Wrong password');
    }
  })
});

//LOGOUT
router.get('/logout', function (req, res, next) {
  res.cookie('jwt', "", { expires: new Date(0) });
  res.redirect('login')
});

//PRFOILE
router.get('/profile', function (req, res, next) {
  let token = req.cookies.jwt;
  authService.verifyUser(token)
    .then(user => {
      models.users.findOne({
        where: {
          UserId: user.UserId,

        },
        include: [{
          model: models.posts, where: { Deleted: false }
        }]
      }).then(userFound => {
        // console.log(userData);
        if (user) {
          res.render('profile', {
            FirstName: userFound.FirstName,
            LastName: userFound.LastName,
            Username: userFound.Username,
            Posts: userFound.posts
          });
        } else {
          res.status(401);
          res.send('Invalid authentication token');
        }
      })
    });
});

//USER POSTS - CREATE, EDIT, DELETE -- POSTS ROUTES



//ADMIN

router.get('/admin', function (req, res, next) {
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user.Admin) {
          models.users.findAll({
            where: {
              Deleted: false
            }
          })
            .then(usersFound => {
              res.render('admin', {
                users: usersFound
              });
            })
        } else {
          res.status(401);
          res.send('Unauthorized');
        }
      });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

router.get('/admin/editUser/:id', function (req, res, next) {
  const UserId = parseInt(req.params.id);
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user.Admin) {
          models.users.findOne({
            where: {
              UserId: UserId,
            },
            include: [{
              model: models.posts, where: { Deleted: false }
            }]
          }).then(userFound => {
            if (user) {
              res.render('editUser', {
                FirstName: userFound.FirstName,
                LastName: userFound.LastName,
                Username: userFound.Username,
                Posts: userFound.posts
              });
            } else {
              res.status(401);
              res.send('Unauthorized');
            }
          })
        };
      });
    }
});


//INDIVIDUAL USER -- DELETE USER AND POST

router.post("/admin/delete/:id", function (req, res, next) {
  let usersId = parseInt(req.params.id);
  models.users
    .update(
      { Deleted: true },
      { where: { UserId: usersId } }
    )
    .then(result => res.redirect('/users/admin'))
    .catch(err => {
      res.send("There was a problem deleting the user.");
    })
});

module.exports = router;
