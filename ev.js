// var request = require('request');
// var moment = require('moment-timezone');
// var cheerio = require('cheerio');
// var async = require('async');
// var format = require('util').format;

// var Mul = require('./services/multi_date.js');

var db = require('monk')(config.db);

var Events = db.get('events');
var Creators = db.get('creators');
var Locations = db.get('locations');

var graph = require('fbgraph');

var _ = require('lodash');

// _.mixin({
//   compactObject: function(o) {
//     var clone = _.clone(o);
//     _.each(clone, function(v, k) {
//       if (!v) {
//         delete clone[k];
//       }
//     });
//     return clone;
//   }
// });

function deepCompact(object) {
  var oType = typeof object;
  if (object !== null && oType != 'undefined') {
    if ((object instanceof Object || Array.isArray(object)) && !(object instanceof Date)) {
      var ret;
      if (object instanceof Array) {
        ret = object.map(function(val, key, col) {
          return deepCompact(val);
        });
        if (ret.length > 0) {
          return ret;
        }
      } else {
        var keys = Object.keys(object);
        ret = keys.reduce(function(acc, val, key) {
          var tmp = deepCompact(object[val]);
          if (tmp) {
            acc[val] = tmp;
          }
          return acc;
        }, {});
        if (typeof ret == 'object' && Object.keys(ret).length > 0) {
          return ret;
        }
      }
    } else if (oType == 'string' || oType == 'boolean' || oType == 'number') {
      return object;
    } else if (object instanceof Date) {
      return String(object);
    } else if (!(object instanceof Object) && !(object instanceof Array)) {
      return typeof object;
    }
  }
}

_.mixin({
  deepCompact: deepCompact
});

var accessToken = 'CAAKvXHZBBCIUBAKxziBs2XqpwBvjLF7VZBxuLaJrzw0rMt2vmgSUWOODJ8CjcMbMJumHKrppPD5wxVkCslNSUJ2ednqyC797EpOjbzPRj8g0iuicEZCyu0KFY7zyFwZBRZCeKzVMOE3gzojysuyWrkeZBKYJw8eFmXz0of73TXqnLVZCV9jgbYIgJDa5EX65sE9HApsFq7fx7Ff9fchrQHM';
graph.setAccessToken(accessToken);

//var keywords = ['salsa', 'bachata', 'kizomba', 'porto', 'cubaine', 'cubana', 'semba', 'samba', 'merengue', 'tango', 'lambazouk', 'zouk', 'regueton', 'reggaeton', 'kuduru', 'chachacha', 'zumba']; //'suelta'

function existsInDb(eid, cb) {
  var res;

  Events.findOne({
    eid: eid
  }).on('complete', function(err, doc) {
    if (err) console.log(err);
    if (!doc) {
      res = false;
    } else {
      res = true;
    }

    cb(res);
  });
}


// function convertDateToTimeZone(date, timezone) {
//   date = new Date(date);

//   if (!timezone) {
//     return date;
//   }

//   var transformed = moment(date.getTime() - 3600000).tz(timezone).format("YYYY/MM/DD hh:mm A");
//   transformed = new Date(transformed);

//   return transformed;
// }

function runQuery(query, cb) {
  graph.fql(query, function(err, res) {
    if (err) {
      console.log(err);
      cb(false);
      return;
    }
    var result;
    if (res.data && res.data.length) {
      result = res.data;
    } else {
      result = false;
    }
    cb(result);
  });
}

function save(ev, cb) {
  if (ev) {
    Events.insert(ev, function(err, newEv) {
      if (err) {
        console.log(err);
      } else {
        if (ev) {
          if (ev.location && ev.venue) {
            Locations.insert({
              location: ev.location,
              venue: ev.venue
            });
          }

          if (ev.creator) {
            Creators.insert({
              fid: ev.creator.id,
              username: ev.creator.name
            });
          }
        }

        cb(newEv);
      }
    });
  }
}

//   var query = {
//     user_event: "SELECT description, feed_targeting, host, attending_count, eid, location, name, privacy, start_time, end_time, update_time, ticket_uri, venue, pic_cover, timezone FROM event WHERE eid IN (" + eids + ")",
//     event_attending: "SELECT uid FROM event_member WHERE eid IN (SELECT eid FROM #user_event) and rsvp_status = 'attending' LIMIT 50000",
//     event_photos: "SELECT images FROM photo WHERE object_id IN (SELECT pic_cover.cover_id FROM #user_event)",

function fetch(eid, term, cb) {
  eid = parseInt(eid);

  existsInDb(eid, function(exists) {
    if (!exists) {
      console.log(eid);
      get(eid, term, function(ev) {
        if (ev) {
          ev.saved = new Date();
          save(ev, function(newEv) {
            console.log(newEv);
            cb(newEv);
          });
        }
      });
    } else {
      update(eid, function(ev) {
        cb(ev);
      });
    }
  });
}

function get(eid, term, cb) {
  eid = parseInt(eid);

  graph.get("/" + eid, function(err, ev) {
    if (err) {
      console.log(err);
    }
    if (ev) {
      ev.eid = eid;

      getPicture(ev.eid, function(picture) {
        ev.picture = picture;

        getCover(ev.eid, function(cover) {
          ev.cover = cover;
          getAttendings(ev.eid, function(attending) {
            ev.attending = [];

            for (var i = attending.length - 1; i >= 0; i--) {
              ev.attending.push(parseInt(attending[i].uid));
            }

            ev.attending = [];

            ev.creator = '';

            ev.query = term;

            ev = normalize(ev);

            cb(ev);
          });
        });
      });
    }
  });

  // var query = {
  //   user_event: "SELECT description, feed_targeting, host, attending_count, eid, location, name, privacy, start_time, end_time, update_time, ticket_uri, venue, pic, pic_big, pic_small, pic_square, pic_cover, has_profile_pic, pic, creator, timezone FROM event WHERE eid =" + eid,
  //   event_attending: "SELECT uid FROM event_member WHERE eid IN (SELECT eid FROM #user_event) and rsvp_status = 'attending' LIMIT 50000",
  //   event_creator: "SELECT name, id FROM profile WHERE id IN (SELECT creator FROM #user_event)",
  // };

  // runQuery(query, function(data) {
  //   if (data) {
  //     if (data[0].fql_result_set[0]) {

  //       ev = data[0].fql_result_set[0];

  //       ev.eid = eid;

  //       var attending = data[1].fql_result_set;

  //       ev.attending = [];

  //       for (var i = attending.length - 1; i >= 0; i--) {
  //         ev.attending.push(parseInt(attending[i].uid));
  //       }

  //       ev.creator = data[2].fql_result_set[0];

  //       ev.query = term;

  //       ev = normalize(ev);

  //       cb(ev);
  //     } else {
  //       cb(false);
  //     }
  //   } else {
  //     cb(false);
  //   }
  // });
}

function update(eid, cb) {
  get(eid, null, function(ev) {
    ev.updated = new Date();

    Events.update({
      eid: ev.eid
    }, {
      $set: ev
    }).error(function(err) {
      console.log(err);
    });
    cb(ev);
  });
}

// function updateMultiple(eids) {
//   fetchMultiple(eids, '', function(eves) {
//     var eids = [];
//   });
// }

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

function normalize(ev) {
  ev.eid = parseInt(ev.eid);

  if (ev.id) {
    delete ev.id;
  }

  ev.start_time2 = ev.start_time;
  ev.end_time2 = ev.end_time;
  ev.update_time2 = ev.update_time;
  // var NightLife = new Date(ev.start_time).getHours();
  // if (NightLife >= 21 || NightLife < 5)
  //   ev.categorie.push("NightLife");
  ev.start_time = new Date(ev.start_time);
  ev.end_time = new Date(ev.end_time);
  ev.update_time = new Date(ev.update_time);

  ev.slug = slug(ev.name.toLowerCase());

  // ev.tags = getTags(ev);

  // ev = getFestival(ev);

  ev.price = getPrice(ev);

  // ev.multi_date = Mul.getMultiDates(ev);

  if (ev.venue) {
    ev.venue.coord = {
      lng: ev.venue.longitude,
      lat: ev.venue.latitude
    };

    delete ev.venue.latitude;
    delete ev.venue.longitude;
  }


  if (!ev.venue || !ev.venue.coord || !ev.venue.coord.lng || !ev.venue.coord.lat) {
    ev.venue = {
      city: "City",
      country: "Antarctique",
      street: "Street",
      zip: "99999",
      coord: {
        lng: -135,
        lat: -82.862751
      }
    };
  }

  // ev = _.deepCompact(ev);

  // delete ev.pic_cover;

  // if (ev.place.indexOf('porto')) {
  //   if (ev.term === 'porto') {
  //     ev = null;
  //   }
  // }

  return ev;
}

function updateAttendings(eid, cb) {
  getAttendings(eid, function(attendings) {
    Events.update({
      eid: parseInt(eid)
    }, {
      $set: {
        attending: attendings
      }
    });
    cb(attendings);
  });

}

function getAttendings(eid, cb) {
  graph.get("/" + eid + '/attending', function(err, res) {
    if (err) {
      console.log(err);
    }
    if (res && res.data) {
      var att = res.data;

      if (att) {
        attendings = [];

        for (var i = att.length - 1; i >= 0; i--) {
          attendings.push(parseInt(att[i].id));
        }
        cb(attendings);
      }
    }
  });
}

function updateCover(eid, cb) {
  getCover(eid, function(cover) {
    Events.update({
      eid: parseInt(eid)
    }, {
      $set: {
        cover: cover
      }
    });
    cb(cover);
  });
}

function getCover(eid, cb) {
  graph.get("/" + eid + '?fields=cover', function(err, res) {
    if (err) {
      console.log(err);
    }
    if (res) {
      if (res.cover) {
        cb(res.cover);
      }
    }
  });
}

function updatePicture(eid, cb) {
  getPicture(eid, function(picture) {
    Events.update({
      eid: parseInt(eid)
    }, {
      $set: {
        picture: picture
      }
    });
    cb(picture);
  });

}

function getPicture(eid, cb) {
  graph.get("/" + eid + '/picture', function(err, picture) {
    if (err) {
      console.log(err);
    }

    cb(picture);
  });
}

function getFromUser(userName, accessToken, userLoggedIn, cb) {
  graph.get(userName + '/events?limit=50000', function(err, res) {
    var evs = res.data;

    if (evs) {
      evs.forEach(function(ev) {
        var start_time = new Date(Date.parse(ev.start_time));
        var now = new Date();

        if (start_time > now || start_time.getFullYear() < 2016) {
          var term = 'user';

          if (userLoggedIn) {
            term = 'userLoggedIn';
          }

          fetch(parseInt(ev.id), term, function(result) {
            // newEvents++;
            console.log(userName + ': ' + ev.name);

            if (!result) {
              updateAttendings(ev.id, function(attendings) {});
            }
          });
        }
      });
    }
  });
}

// function crawlUser(userName, cb) {
//   var options = {
//     url: format('http://facebook.com/%s/events', userName),
//     headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36'
//     }
//   };

//   request(options, function (err, response, body) {
//     if (err) throw err;

//     body = body.removeAll('<!--').removeAll('-->');

//     var $ = cheerio.load(body);

//     if (body) {
//       if ($('.eventsGrid').length) {
//         $('.eventsGrid').each(function(i, elem) {
//           var url = $(this).find('a').attr('href');
//           var re = /\d+/i;
//           var id = url.match(re);

//           fetch(id[0], 'user', function(ev){
//             // newEvents++;
//             console.log(userName + ': ' + ev.name);
//             cb(true);
//           });
//         });
//       } else {
//         cb(false);
//       }
//     }
//   });
// }

// function crawlUserTimeline(userName, cb) {
//   var options = {
//     url: format('http://facebook.com/%s', userName),
//     headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36'
//     }
//   };

//   request(options, function (err, response, body) {
//     if (err) throw err;

//     body = body.removeAll('<!--').removeAll('-->');

//     if (body) {
//       var $ = cheerio.load(body);

//       if ($('.timelineUnitContainer').length) {
//         $('.timelineUnitContainer').each(function(i, elem) {
//           var url = $(this).find('a[href^="/events/"]').attr('href');

//           if (url) {
//             var re = /\d+/i;
//             var id = url.match(re);

//             fetch(id[0], 'user', function(ev){
//               // newEvents++;
//               console.log(userName + ': ' + ev.name);
//               cb(true);
//             });
//           }
//         });
//       } else {
//         cb(false);
//       }
//     }
//   });
// }

// function crawlPage(pageId) {
//   var options = {
//     url: format('http://facebook.com/%s', pageId),
//     headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36'
//     }
//   };

//   request(options, function (err, response, body) {
//     if (err) throw err;

//     body = body.removeAll('<!--').removeAll('-->');

//     var $ = cheerio.load(body);

//     if (body) {
//       $('.eventsGrid').each(function(i, elem) {
//         var url = $2(this).find('a').attr('href');
//         var re = /\d+/i;
//         var id = url.match(re);

//         fetch(id[0], 'user', function(ev){
//           // newEvents++;
//           console.log(userName + ': ' + ev.name);
//         });
//       });
//     }
//   });
// }

// function crawlPageTimeline(pageId) {
//   var options = {
//     url: format('http://facebook.com/%s', pageId),
//     headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36'
//     }
//   };

//   request(options, function (err, response, body) {
//     if (err) throw err;

//     body = body.removeAll('<!--').removeAll('-->');

//     if (body) {
//       var $ = cheerio.load(body);

//       $('.timelineUnitContainer').each(function(i, elem) {
//         var url = $(this).find('a[href^="/events/"]').attr('href');

//         if (url) {
//           var re = /\d+/i;
//           var id = url.match(re);

//           fetch(id[0], 'page', function(ev){
//             // newEvents++;
//             console.log(pageId + ': ' + ev.name);
//           });
//         }
//       });
//     }
//   });
// }

// function getTags(ev) {
//   var tags = [];

//   var name = ev.name;
//   var desc = ev.description;
//   var query = ev.query;
//   var text = name + ' ' + desc + ' ' + ev.query;
//   text = text.toLowerCase();

//   for (var i = 0; i < global.keywords.length; i++) {
//     var str = global.keywords[i].toLowerCase();
//     var n = text.search(str);

//     if (n > 0) {
//       tags.push(global.keywords[i].toLowerCase());
//     }
//   }
//   return tags;
// }

// function getFestival(ev) {
//   var festival = false;

//   var name = ev.name;
//   var desc = ev.description;

//   var text = name + ' ' + desc;
//   text = text.toLowerCase();
//   var words = ["congress", "festival", "concert", "cours ", "class "];
//   var alreadyin = false;
//   for (var i = 0; i < words.length; i++) {
//     var str = words[i];
//     var n = text.search(str);

//     if (n > 0) {
//       festival = true;
//       if (words[i] == "cours " || words[i] == "class ") {
//         words[i] = "class";
//         alreadyin = true;
//       }
//       if (alreadyin == false) {
//         ev.categorie.push(words[i]);
//       }
//     }
//   }

//   return ev;
// }

function getPrice(ev) {
  var desc = ev.name + ' ' + ev.description;
  desc = desc.toLowerCase();

  // var n = desc.indexOf('$');
  // var n2 = desc.indexOf('€');
  // var n3 = desc.indexOf('euro');

  var regex = /(\d+[-\s]?[\$\£\€])|([\$\£\€][-\s]?\d+)/g;

  var match = desc.match(regex);

  var price;

  if (match) {
    var numbers = match.join().removeAll("$").removeAll("£").removeAll("€").split(',');
    var min = numbers.min();
    if (min <= 2 && numbers.length > 1) {
      var i = 0;
      var j = 0;
      var new_numbers = [];
      while (numbers[i]) {
        if (numbers[i] != min) {
          new_numbers[j] = parseInt(numbers[i]);
          ++j;
        }
        ++i;
      }
      min = new_numbers.min();
      numbers = new_numbers;
    }
    if (min > 1000) {
      return {};
    }

    price = {
      full: match[numbers.indexOf(min)],
      num: min
    };

    return price;
  } else {
    var regex2 = /((gratuit)|(free)|(gratis))/;

    var match2 = desc.match(regex2);

    if (match2) {
      price = {
        full: match2[0].toUpperCase(),
        num: 0
      };

      return price;
    } else {
      return {};
    }
  }
}

function getPriceFromFullPrice(price) {
  var number = price.removeAll("$").removeAll("£").removeAll("€").split(',');

  price = {
    full: price,
    num: number
  };

  return price;
}

Array.prototype.min = function() {
  return Math.min.apply(Math, this);
};

String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};

String.prototype.removeAll = function(target) {
  return this.split(target).join('');
};

function findById(eid, cb) {
  Events.findOne({
    eid: parseInt(eid)
  }).on('complete', function(err, doc) {
    if (err) console.log(err);
    cb(doc);
  });
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports.capitalize = capitalize;
module.exports.findById = findById;
module.exports.fetch = fetch;
module.exports.get = get;
module.exports.save = save;
module.exports.update = update;
// module.exports.updateMultiple = updateMultiple;
module.exports.runQuery = runQuery;
// module.exports.getTags = getTags;
module.exports.getPrice = getPrice;
module.exports.getPriceFromFullPrice = getPriceFromFullPrice;
// module.exports.crawlPage = crawlPage;
// module.exports.crawlPageTimeline = crawlPageTimeline;
// module.exports.crawlUser = crawlUser;
// module.exports.crawlUserTimeline = crawlUserTimeline;
module.exports.getFromUser = getFromUser;
module.exports.updateAttendings = updateAttendings;
module.exports.getAttendings = getAttendings;
// module.exports.fetchMultiple = fetchMultiple;
module.exports.normalize = normalize;
module.exports.existsInDb = existsInDb;
// module.exports.convertDateToTimeZone = convertDateToTimeZone;
