var Users = global.db.get('users');
var request = require('request');
var Ev = require('../ev');

var graph = require('fbgraph');

function getLocation(req, cb) {
  // if (!req.session.loc) {  
    var ip;
    if (process.env.NODE_ENV === 'development') {
      ip = "190.195.18.48";
    } else {
      ip = req.connection.remoteAddress;
    }
    request('http://ip-api.com/json/' + ip, function(error, response, body) {
     var location = JSON.parse(body);
      if (location.status === 'fail' || location.city === '' || location.lat === '' || location.lon === '') {
        var location = {
          city: 'Paris',
          country: 'France',
          lng: 2.3333,
          lat: 48.8667
        };
      }
      else
      {
        var location = JSON.parse(body);
        location.city = slug(location.city);
      }

      req.session.loc = location;

      req.session.loc.lat = req.session.loc.latitude;
      req.session.loc.lng = req.session.loc.longitude;

      delete req.session.loc.latitude;
      delete req.session.loc.longitude;

      cb(req.session.loc);
    });
  // } else {
  //   cb(req.session.loc);
  // }
}

function slug(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
  var to = "aaaaaeeeeeiiiiooooouuuunc------";
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
  Ev.getFromUser(req.user.username, req.user.accessToken, true, function() {});
  console.log(req.session.redirectUrl);

  if (req.query.fb_source) {
    req.query.request_ids = req.query.request_ids.split(',')[0];
    var query = req.query.request_ids + '_' + req.user.facebook.id + '?access_token=' + req.user.accessToken;
    graph.get(query, function(err, data) {
      // res.redirect(data.data);

      getLocation(req, function(loc) {
        res.render('index', {
          title: 'quesale',
          is_mobile: req.is_mobile,
          user: req.user ? JSON.stringify(req.user) : 'null',
          fbAppId: global.fbAppId,
          loc: loc,
          redirectPath: data.data
        });
      });



      // res.send('<!DOCTYPE html>' +
      //           '<body>' +
      //             '<script type="text/javascript">' +
      //               'top.location.href = "' + data.data + '";' +
      //             '</script>' +
      //           '</body>' +
      //         '</html>' );
    });
  } else if (req.session.redirectUrl) {
    res.redirect(req.session.redirectUrl);
    delete req.session.redirectUrl;
  }
};

/**
 * Show login form
 */
exports.signin = function(req, res) {
  res.render('users/signin', {
    title: 'Signin',
    message: req.flash('error')
  });
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: {}
  });
};

/**
 * Logout
 */
exports.signout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * Session
 */
exports.session = function(req, res) {
  res.redirect('/');
};

/**
 * Create user
 */
// exports.create = function(req, res, next) {
//     var user = new User(req.body);
//     var message = null;

//     user.provider = 'local';
//     Users.insert(user, function(err) {
//         if (err) {
//             switch (err.code) {
//                 case 11000:
//                 case 11001:
//                     message = 'Username already exists';
//                     break;
//                 default:
//                     message = 'Please fill all the required fields';
//             }

//             return res.render('users/signup', {
//                 message: message,
//                 user: user
//             });
//         }
//         req.logIn(user, function(err) {
//             if (err) return next(err);
//             return res.redirect('/');
//         });
//     });
// };

/**
 * Send User
 */
// exports.me = function(req, res) {
//     res.jsonp(req.user || null);
// };

/**
 * Find user by id
 */
// exports.user = function(req, res, next, id) {
//     Users.findById(id, function(err, user) {
//         if (err) return next(err);
//         if (!user) return next(new Error('Failed to load User ' + id));
//         req.profile = user;
//         next();
//     });
// };

exports.getEvents = function(req, res) {
  var events = {};

  res.render('index', {
    title: 'quesale',
    user: req.user ? JSON.stringify(req.user) : 'null',
    fbAppId: global.fbAppId,
    events: events
  });
};

exports.getMyEvents = function(req, res) {
  var events = {};

  res.render('index', {
    title: 'quesale',
    user: req.user ? JSON.stringify(req.user) : 'null',
    fbAppId: global.fbAppId,
    events: events
  });
};

exports.getOne = function(req, res) {
  Users.findOne({
    'facebook.id': req.params.uid
  }, function(err, data) {
    if (err) {
      res.render('error', {
        status: 500
      });
    } else {
      res.json(data);
    }
  });
};

exports.getInfo = function(req, res) {
  Users.find({
    'facebook.id': {
      $in: req.params.uids.split(',')
    }
  }, function(err, data) {
    if (err) {
      res.render('error', {
        status: 500
      });
    } else {
      res.json(data);
    }
  });
};

exports.getPicture = function(req, res) {
  graph.get('/' + req.user.facebook.id + '?fields=picture' + '&access_token=' + req.user.accessToken, function(err, result) {
    if (err)
      console.log(err);
    else
      res.json(result);
  });
};