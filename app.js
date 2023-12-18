var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const {
  COOKIE_EXPIRATION_MS,
} = process.env


//lấy đường dẫn thư mục gốc
global.appRoot = path.resolve(__dirname);

var app = express();
app.locals.nav = require('./const').nav; //lấy biến nav

//khai báo session
app.use(session({
  secret: 'webslesson',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    expires: Date.now() + parseInt(COOKIE_EXPIRATION_MS, 10),
    maxAge: parseInt(COOKIE_EXPIRATION_MS, 10),
  }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({
  limit: '10mb' //giới hạn dung lượng khi request
}));
app.use(express.urlencoded({
  extended: false,
  limit: '10mb'
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* app.use(express.bodyParser({
  limit: '10mb'
})); */

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/employees', require('./routes/employees'));
app.use('/monitoring', require('./routes/monitors'));
app.use('/entertainment', require('./routes/entertainment'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.title = " - Không tìm thấy trang";
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;