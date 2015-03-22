var express = require('express');
var passport = require('passport');
var session = require('express-session');
var helpers = require('view-helpers');
// var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var compression = require('compression');
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var MongoStore = require('connect-mongo')({
  session: session
});

// var fs = require('fs');
// var https = require('https');

global.rootDir = __dirname + '/';
global.publicDir = rootDir + 'public/';
global.distDir = rootDir + 'dist/';
global.configDir = rootDir + 'config';
global.routesDir = rootDir + 'routes/';
global.middlewaresDir = routesDir + 'middlewares/';
global.viewsDir = rootDir + 'views/';
global.controllersDir = rootDir + 'controllers/';

// Initializing system variables
global.config = require(configDir + '/env/' + process.env.NODE_ENV + '.js');

var app = express();

global.db = require('monk')(config.db);
global.Ev = require('./ev');

// Bootstrap passport config
require('./config/passport')(passport);

// process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  // app.use(morgan('dev'));
  app.locals.pretty = true;
  app.set('dumpExceptions', true);
  app.set('showStackError', true);
  // app.use(express.logger('dev'));
}

app.use(compression({
  filter: function(req, res) {
    return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
  },
  level: 9
}));

app.set('views', viewsDir);
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(cookieParser());

app.use(methodOverride());

// Express/Mongo session storage
app.use(session({
  secret: 'aguantepantera',
  saveUninitialized: true,
  resave: true,
  store: new MongoStore({
    url: global.config.db,
    autoReconnect: true
  })
}));

// Use passport session
app.use(passport.initialize());
app.use(passport.session());

app.use(helpers(global.config.app.name));

app.use(favicon(publicDir + 'favicon.ico'));

app.use(serveStatic(publicDir));
app.use(serveStatic(distDir));

require(routesDir + 'api/events')(app, passport, db);

// var fs = require('fs');
// var walk = function(path) {
//   fs.readdirSync(path).forEach(function(file) {
//     var newPath = path + '/' + file;
//     var stat = fs.statSync(newPath);
//     if (stat.isFile()) {
//       if (/(.*)\.(js$)/.test(file)) {
//         require(newPath)(app, passport, db);
//       }
//       // We skip the app/routes/middlewares directory as it is meant to be
//       // used and shared by routes as further middlewares and is not a
//       // route by itself
//     } else if (stat.isDirectory() && file !== 'middlewares') {
//       walk(newPath);
//     }
//   });
// };

// walk(routesDir);

// app.use(function(err, req, res, next) {
//   // Treat as 404
//   if (~err.message.indexOf('not found')) return next();

//   // Log it
//   console.error(err.stack);

//   // Error page
//   res.status(500).render('500', {
//     error: err.stack
//   });
// });

// app.use(function(req, res, next) {
//   res.status(404).render('404', {
//     url: req.originalUrl,
//     error: 'Not found'
//   });
// });

var port = process.env.PORT || config.port;

// var privateKey  = fs.readFileSync(rootDir + '../quesale-key.pem', 'utf8');
// var certificate = fs.readFileSync(rootDir + '../quesale-crt.pem', 'utf8');
// var credentials = {key: privateKey, cert: certificate};

// var httpsServer = https.createServer(credentials, app);

app.listen(port);
// httpsServer.listen(443);

console.log('Express app started on port ' + port);

// Expose app
exports = module.exports = app;