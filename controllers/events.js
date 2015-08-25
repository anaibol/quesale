var url = require('url');

var request = require('request');
var graph = require('fbgraph');

var moment = require('moment');

var fs = require('fs');

var Creators = db.get('creators');
var Locations = db.get('locations');
var Events = global.db.get('events');
var Payments = global.db.get('payments');

var Ev = require('../ev');

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}

function parseDataURL(string) {
  var regex = /^data:.+\/(.+);base64,(.*)$/;

  var match = string.match(regex);

  var buffer = new Buffer(match[2], 'base64');

  return {
    ext: match[1],
    data: new Buffer(match[2], 'base64')
  };
}

function getLocation(req, cb) {
  if (!req.session.loc) {
    var ip;
    if (process.env.NODE_ENV === 'development') {
      ip = '82.142.63.255';
    } else {
      ip = req.connection.remoteAddress;
    }

    request('http://freegeoip.net/json/' + ip, function(error, response, body) {
      var location = JSON.parse(body);
      req.session.loc = location;

      req.session.loc.lat = req.session.loc.latitude;
      req.session.loc.lng = req.session.loc.longitude;

      delete req.session.loc.latitude;
      delete req.session.loc.longitude;

      cb(req.session.loc);
    });
  } else {
    cb(req.session.loc);
  }
}

exports.importFromUser = function(req, res) {
  Ev.getFromUser(req.params.name, null, function(result) {
    res.send(result);
  });
};

exports.import = function(req, res) {
  Ev.fetch(req.params.eid, 'import', function(ev) {
    res.json(ev);
  });
};

exports.get = function(req, res) {
  // getLocation(req, function() {
  var url_parts = url.parse(req.url, true);
  var params = url_parts.query;

  var limit;

  if (req.isMobile) {
    limit = 5;
  } else {
    limit = 30;
  }

  limit = 10000;

  var skip = params.skip || 0;
  var sortBy = params.sortBy || 'proximity';
  var sortOrder = params.sortOrder || 1;
  var since = params.since || 0;
  var until = params.until || 0;

  // if (params.sortBy === 'popularity') {
  //   sortBy = 'attending_count';
  //   sortOrder = -1;
  // }

  var sortStr = '{"' + sortBy + '" :' + sortOrder + '}';
  var sort = JSON.parse(sortStr);

  since = new Date(since);

  var query = {
    start_time: {
      $gte: since
    }
  };

  if (params.lat && params.lng) {
    query['venue.coord'] = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(params.lng), parseFloat(params.lat)]
        },
        $maxDistance: 50000
      }
    };
  }

  query['venue.street'] = {
    $exists: true
  };

  // query.attending = {
  //   $size: 1
  // };

  // if (params.country) {
  //   query['venue.country'] = {
  //     $regex: new RegExp(params.country, "i")
  //   };

  //   delete query['venue.coord'];
  // }

  // var query1 = clone(query);
  // var query2 = clone(query);

  // delete query1['venue.country'];
  // delete query1['venue.coord'];

  // query = {
  //   $or: [query1, query2]
  // };

  // if(params.city) {
  //   query['venue.country'] = {
  //     $regex: new RegExp(params.country, "i")
  //   };
  // }

  var options = {
    limit: limit,
    skip: skip,
    fields: {
      attending: 0
    }
  };

  // if (params.sortBy !== 'proximity') {
  //   options.sort = sort;
  // }

  // var tags = params.tags;
  // var realTags = [];
  // if (tags) {
  //   tags = tags.split(',');

  //   tags.forEach(function(tag) {
  //     switch (tag) {
  //       case 'popular':
  //         query.attending_count = {
  //           $gt: 50
  //         };

  //         break;

  //       case 'festival':
  //         query.festival = true;

  //         break;

  //       case 'promoted':
  //         query.promoted = true;

  //         break;

  //       case 'free':
  //         query["price.num"] = 0;

  //         break;

  //       default:
  //         realTags.push(tag);

  //         break;
  //     }
  //   });

  //   if (realTags.length) {
  //     query.tags = {
  //       $all: realTags
  //     };
  //   }
  // }

  // switch (params.tag) {
  //   case 'user':
  //     delete query.start_time;
  //     delete query.$near;

  //     var query1 = clone(query);
  //     var query2 = clone(query);

  //     if (params.user) {
  //       query1["creator.name"] = params.user;

  //       graph.get(params.user, function(err, res) {
  //         var usr = res.data;

  //         // if (usr) {
  //         //   console.log(urs);
  //         // }
  //       });
  //     } else {
  //       query1["creator.id"] = req.user.facebook.id;
  //     }

  //     query2.attending = {
  //       $all: [parseInt(req.user.facebook.id)]
  //     };

  //     // query = {
  //     //   $or: [query1, query2]
  //     // };

  //     break;

  //   case 'date':
  //     if (until) {
  //       until = new Date(until);

  //       query.start_time = {
  //         $gte: since,
  //         $lt: until
  //       };
  //     } else {
  //       query.start_time = {
  //         $gte: since
  //       };
  //     }

  //     break;

  //   case 'worldwide':
  //     delete query.$near;

  //     break;

  //   case 'popular':
  //     delete query.tags;
  //     delete query.$near;
  //     sort.attending_count = -1;

  //     break;

  //   case 'festival':
  //     query.festival = true;

  //     delete query.tags;
  //     delete query.$near;
  //     sort.attending_count = -1;

  //     break;

  //   case 'promoted':
  //     query.promoted = true;

  //     delete query.tags;
  //     delete query.$near;

  //     break;

  //   case 'free':
  //     query["price.num"] = 0;

  //     delete query.tags;
  //     delete query.$near;

  //     break;

  //     // case 'weekend':
  //     //   var friday = moment().day(5).toDate();
  //     //   var sunday = moment().day(7).toDate();

  //     //   query.start_time = {
  //     //     $gte: friday,
  //     //     $lt: sunday
  //     //   };

  //     //   break;
  // }

  // var query2 = _.clone(query);

  // delete query2.start_time;

  // query2.repeat = moment().format('dddd');

  // query = {$or:[
  //     query,
  //     query2
  // ]};

  Events.find(query, options, function(err, data) {
    // if (!data || data.length < 1) {
    //   query['venue.coord'] = {
    //     $near: {
    //       $geometry: {
    //         type: "Point",
    //         coordinates: [parseFloat(params.lng), parseFloat(params.lat)]
    //       },
    //       $maxDistance: 100000
    //     }
    //   };
    //   Events.find(query, options, function(err, data) {
    //     if (err) {
    //       console.log(err);
    //       res.render('error', {
    //         status: 500
    //       });
    //     } else {
    //       res.json(data);
    //     }
    //   });
    // } else {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(data);
    // }
  });
  //});
};

exports.getOne = function(req, res) {
  Events.findOne({
    eid: parseInt(req.params.eid)
  }, {
    fields: {
      attending: 0
    }
  }, function(err, ev) {
    if (err) {
      res.render('error', {
        status: 500
      });
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.json(ev);
      // Ev.update(req.params.eid, function(ev) {});
    }
  });
};

// exports.create = function(req, res) {
//   var ev;
//   var image;

//   if (typeof req.body.model === 'string') {
//     ev = JSON.parse(req.body.model);
//     image = req.body.image;
//   } else {
//     ev = req.body;
//   }

//   ev.start_time = new Date(ev.start_time);
//   ev.end_time = new Date(ev.end_time);

//   if (image) {
//     var parsed = parseDataURL(image);
//     ev.imageExt = parsed.ext;
//   }

//   ev.creator = {
//     id: req.user.facebook.id,
//     name: req.user.username
//   }

//   if (ev.price.full) {
//     ev.price = Ev.getPriceFromFullPrice(ev.price.full);
//   }

//   Events.insert(ev, function(err, obj) {
//     if (err) {
//       console.log(err);
//     } else {
//       if (image) {
//         var newImageLocation = __dirname + '/../../public/uploads/' + obj._id + '.' + obj.imageExt;
//         fs.writeFileSync(newImageLocation, parsed.data);
//       }

//       if (obj) {
//         if (obj.location && obj.venue) {
//           Locations.insert({
//             location: obj.location,
//             venue: obj.venue,
//             place: obj.place
//           });
//         }

//         if (obj.creator) {
//           Creators.insert({
//             fid: obj.creator.id,
//             username: obj.creator.name
//           });
//         }
//       }

//       var fbEv = {
//         name: ev.name,
//         description: ev.description,
//         start_time: ev.start_time
//       }

//       graph.post('/me/events?access_token=' + req.user.accessToken, fbEv, function(err, res) {
//         // returns the post id
//         console.log(err)
//         console.log(res); // { id: xxxxx}
//       });

//       res.json(obj);
//     }
//   });
// };

exports.updateAll = function(req, res) {
  var date = new Date();

  date.setSeconds(0);
  date.setMinutes(0);
  date.setHours(0);

  Events.find({
    end_time: {
      $gte: date
    }
  }, {
    sort: {
      'attending_count': -1
    },
    limit: 50
  }).success(function(evs) {
    var eids = [];

    evs.forEach(function(ev) {
      eids.push(parseInt(ev.eid));
    });

    Ev.updateMultiple(eids);
  }).error(function(err) {
    console.log(err);
  });
};

// exports.destroy = function(req, res) {
//   var ev = req.ev;

//   ev.remove(function(err) {
//     if (err) {
//       return res.send('users/signup', {
//         errors: err.errors,
//         ev: ev
//       });
//     } else {
//       res.jsonp(ev);
//     }
//   });
// };


exports.geolocation = function(req, res) {
  console.log(req.body);
  res.send(true);
};
