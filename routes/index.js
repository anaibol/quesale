var request = require('request');
var Events = global.db.get('events');
// var Invitations = db.get('invitations');
var users = require(controllersDir + 'users');

var graph = require('fbgraph');

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

module.exports = function(app, passport) {
  // app.get('*', function(req, res) {
  //   res.json(req.query);
  // });

  app.get('/api/autocomplete/locations', function(req, res) {
    var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?types=(cities)&key=AIzaSyBD3PFdwyYlZ8i-CgUK3kQDUBEfaPY2ALQ&input=' + req.param('q') + '&language=' + req.param('lang') + '&location=' + req.param('lat') + ',' + req.param('lng');
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        res.json(body.predictions);
      }
    });
  });

  app.get('/api/autocomplete/placeid', function(req, res) {
    var url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.param('placeid') + '&key=AIzaSyBD3PFdwyYlZ8i-CgUK3kQDUBEfaPY2ALQ';
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        res.json(body.result.geometry.location);
      }
    });
  });

  app.get('', function(req, res) {
    // getLocation(req, function(loc) {
    //   var i = 0;
    //   var longitude = loc.lon;
    //   var latitude = loc.lat;

    //   if (loc.city) {
    //     res.redirect('/' + slug(loc.city));
    //   }
    // });
    res.render('index');
  });



  app.post('/facebook-canvas', function(req, res) {
    if (req.query.fb_source === 'notification' || req.query.fb_source === 'reminders') {
      var signedRequest = req.body.signed_request;

      var data = signedRequest.split('.')[1];

      data = new Buffer(data, 'base64');
      data = data.toString();
      data = JSON.parse(data);

      var userId = data.user_id;

      req.query.request_ids = req.query.request_ids.split(',');
      var requestId = req.query.request_ids[req.query.request_ids.length - 1];

      // Invitations.findOne({requestId: requestId}, function(err, data) {
        res.redirect(data.url);
        // // console.log( data)
        // // getLocation(req, function(loc) {
        // //   res.render('index', {
        // //     title: 'quesale',
        // //     is_mobile: req.is_mobile,
        // //     user: req.user ? JSON.stringify(req.user) : 'null',
        // //     fbAppId: global.fbAppId,
        // //     loc: loc,
        // //     redirectPath: data.data
        // //   });
        // });
      // });
    } else {
      getLocation(req, function(loc) {
        res.render('index', {
          title: 'quesale',
          is_mobile: req.is_mobile,
          user: req.user ? JSON.stringify(req.user) : 'null',
          fbAppId: global.fbAppId,
          loc: loc
        });
      });
    }
  });

  // app.get('/:slug/:eid', function(req, res) {
  //   getLocation(req, function(loc) {
  //     res.render('index', {
  //       title: 'quesale',
  //       is_mobile: req.is_mobile,
  //       user: req.user ? JSON.stringify(req.user) : 'null',
  //       loc: loc
  //     });
  //   });
  // });

  app.get('/:city/:slug/:eid', function(req, res) {
    getLocFromSlug(req.params.city, function(loc) {
      Events.findOne({eid: parseInt(req.params.eid)}, function(err, ev) {
        res.render('index', {
          title: 'quesale',
          is_mobile: req.is_mobile,
          user: req.user ? JSON.stringify(req.user) : 'null',
          fbAppId: global.fbAppId,
          loc: loc,
          ev: ev
        });
      });
    });
  });

  app.get('/:city/:slug/:eid/game', function(req, res) {
    getLocFromSlug(req.params.city, function(loc) {
      Events.findOne({eid: parseInt(req.params.eid)}, function(err, ev) {
        res.render('index', {
          title: 'quesale',
          is_mobile: req.is_mobile,
          user: req.user ? JSON.stringify(req.user) : 'null',
          fbAppId: global.fbAppId,
          loc: loc,
          ev: ev
        });
      });
    });
  });

  app.get('/:city', function(req, res) {
    getLocFromSlug(req.params.city, function(loc) {
      req.session.loc = loc;

      res.render('index', {
        title: 'quesale',
        is_mobile: req.is_mobile,
        user: req.user ? JSON.stringify(req.user) : 'null',
        fbAppId: global.fbAppId,
        loc: loc,
        evs: true
      });
    });
  });

  function getLocFromSlug(slug, cb) {
    request('http://maps.googleapis.com/maps/api/geocode/json?address=' + slug + '&sensor=false', function (error, res, body) {
      if (!error && res.statusCode == 200) {
        body = JSON.parse(body);
        if (body.results) {
          var loc = body.results[0];

          if (!loc) {
            cb({
              city: 'Paris',
              country: 'France',
              lng: 2.3333,
              lat: 48.8667
            });
            return;
          }

          loc = {
            city: loc.address_components[0].long_name,
            citySlug: slug,
            lng: loc.geometry.location.lng,
            lat: loc.geometry.location.lat
          };

          cb(loc);
        }
      }
    });
  }

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

};