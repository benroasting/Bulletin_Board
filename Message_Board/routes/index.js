var express = require('express');
var router = express.Router();
const mysql = require('mysql2');
var models = require('../models');

router.get('/', function(req, res, next) {
  res.redirect('/signup');
});

module.exports = router;
