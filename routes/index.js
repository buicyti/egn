var routes = require('express').Router();

const {
  wrap
} = require('async-middleware');
const {
  isAuthenticated
} = require('../features/authentication');


/* GET home page. */
routes.get('/', wrap(isAuthenticated), function (req, res, next) {
  res.locals.title = 'Home';
  res.render('index');
});

routes.get('/dashboard', wrap(isAuthenticated), function (req, res, next) {
  res.locals.title = 'Home';
  res.render('pages/dashboard');
});

routes.post('/dashboard/load', wrap(isAuthenticated), function (req, res, next) {
  console.log(req.body)
});



module.exports = routes;