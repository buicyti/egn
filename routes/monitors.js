var route = require('express').Router();


const {
    wrap
} = require('async-middleware');
const {
    isAuthenticated
} = require('../features/authentication');





route.get("/printer", wrap(isAuthenticated), function (req, res, next) {
    res.locals.title = 'Tốc độ Vacuum'
    res.render('./pages/monitors/printer');
});





route.get("/th/factory", wrap(isAuthenticated), function (req, res, next) {
    res.locals.title = 'Theo dõi nhiệt độ Xưởng'
    res.render('./pages/monitors/th-xuong');
});
route.get("/th/lkdt", wrap(isAuthenticated), function (req, res, next) {
    res.render('./pages/monitors/th-xuong');
});


module.exports = route;