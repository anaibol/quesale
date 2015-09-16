global.rootDir = __dirname + '/';
global.configDir = rootDir + 'config';
global.config = require(configDir + '/env/' + process.env.NODE_ENV + '.js');

// var _ = require('lodash');

var Ev = require('./ev');

var db = require('monk')(config.db);
var Events = db.get('events');
// var Mul = require('./services/multi_date.js');
// var Upd = require('./services/update.js');

var Users = db.get('users');
var Creators = db.get('creators');
var Locations = db.get('locations');

var graph = require('fbgraph');

var accessToken = 'CAAXezV0WnNwBAInKn4h1lLXpFMVqsv488Tp2UOTqLukZB4tHTlT5azgX1vYc85hHVz5qr6ed82g0B3Ng9akoy7AiDsyDXaWpOjVVsCRrqCeekt6RxXV5uPdu6NWzxq6ZBbQHyICj9k99DoRX2wdr3oJta2GoW0ZCQBRHkCrWdsw5QblY300FmCDf1xLRvybZCqdNIVfuSgZDZD';
graph.setAccessToken(accessToken);

var users = [];

// global.keywords = ['vicente lopez', 'jose c paz', 'acassuso', 'don torcuato', 'balvanera', 'victoria', 'san miguel', 'tigre', 'martinez', 'la lucila', 'olivos', 'san isidro', 'buenos aires', 'palermo', 'belgrano', 'villa urquiza', 'colegiales', 'chacarita', 'villa crespo', 'rock', 'blues', 'metal', 'jazz', 'tango', 'swing', 'salsa', 'bachata', 'merengue', 'saavedra', 'caballito', 'san cristobal', 'moron', 'san justo', 'pacheco', 'villa ortuzar', 'festival', 'fiesta', 'curso', 'seminario', 'meetup', 'conferencia', 'charla', 'capital federal', 'clase', 'entrada', 'gratis', 'gratuito', 'gratuita', 'aire libre', 'concierto', 'recital'];
global.keywords = ['paris']
// global.keywords = ['rock', 'metal', 'grunge', 'hard rock', 'blues', 'jazz'];
// function starttime2(){
//   var date = new Date();
//   date.setSeconds(0);
//   date.setMinutes(0);
//   date.setHours(0);
//   Events.find({$or:[{
//     start_time: {
//       $gt: date
//     },
//     end_time:{
//       $gt:date
//     }
//   }]}).success(function(evs){
//   var eids = [];
//     evs.forEach(function(ev) {
//       if (!ev.start_time2)
//       {
//         eids.push(parseInt(ev.eid));
//       }
//     });

//     Ev.updateMultiple(eids);
// });}
//   updateNoCover();

var cronJob = require('cron').CronJob;

// var job = new cronJob('*/30 * * * *', function() {
//   var date = new Date();
//   console.log(date.toString());

//   fetchEventsFromKeywords();
//   // updatePopular();

//   // fetchEventsFromUsers();
//   // fetchEventsFromLocations();
// }, null, true);

// updateWeek();
fetchEventsFromKeywords();
// updatePrioritaires();
// updatePopular();

// var send = require('./gcm');

// var fridayJob = new cronJob('0 0 18 1/1 * ? *', function() {

//   Events.findOne({}, {
//     skip: random(1, 1000)
//   }, function(err, ev) {
//     send.send(ev);
//   });
// }, null, true);


function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// function updateNoCover(){
//   console.log('updatepic');
//   Events.find({pic_cover:null}, function(err, evs){
//     var eids = [];
//     evs.forEach(function(ev) {
//       eids.push(parseInt(ev.eid));
//     });
//     if (eids)
//     {
//       Ev.updateMultiple(eids);
//     }
//   });
//   Events.find({pic_cover:null}, function(err, evs){
//     evs.forEach(function (ev){
//       var request = '/' + ev.eid + '/photos?access_token=' + accessToken;
//       graph.get(request, function(err, pic){
//       if (pic.data && pic.data[0])
//       {
//         console.log('PICFOUND');
//         ev.pic_cover = 'https://graph.facebook.com/' + pic.data[0].id + '/picture?width=9999&height=9999'
//         ev.original_cover = null;
//         Events.update({eid:ev.eid}, ev);
//       }
//     });
//     });
//   });
// }
// function updateAntarctique(){
//   var date = new Date();

//   Events.find({
//     start_time:{
//       $gt: date
//     }
//   }).success(function(evs){
//     var eids = [];
//     evs.forEach(function(ev) {
//       eids.push(parseInt(ev.eid));
//     });
//     Ev.updateMultiple(eids);
//   console.log(">>>>>>>>>>>>>" + evs.length + "<<<<<<<<<<<<<");
//   });
// }
// function updateJournalierMultidate(){
//   var date = new Date();
//   date.setSeconds(0);
//   date.setMinutes(0);
//   date.setHours(0);
//   var datebefore = date - 1000 * 60 * 60 * 24;
//   datebefore = new Date(datebefore);
//   Events.find({
//     start_time: {
//       $lt: date,
//       $gt: datebefore
//     },
//     multi_date: true
//   }).success(function(evs){
//     console.log("Il y a >>>" + evs.length + "<<< évènement multi_date updatés !")
//     evs.forEach(function(ev){
//       ev.multi_date = Mul.getMultiDates(ev);
//     });
//     var eids = [];
//     evs.forEach(function(ev) {
//       eids.push(parseInt(ev.eid));
//     });
//     Ev.updateMultiple(eids);
//   });
// }

// function updateMultidate(){
//   var date = new Date();
//   var datebefore = date - 1000 * 60 * 60 * 24;
//   datebefore = new Date(datebefore);
//   date.setSeconds(0);
//   date.setMinutes(0);
//   date.setHours(0);
//   Events.find({$and:[{
//     start_time: {
//       $lt: date,
//   },
//  //     $gt: datebefore
//     end_time: { //a enlever apres avoir fait tourné une fois
//       $gt: date // a enlever apres avoir fait tourné une fois
//     }}]// a enlever apres avoir fait tourné une fois
//   }).success(function(evs){
//     console.log("Il y a >>>" + evs.length + "<<< évènement multi_date updatés !")
//     evs.forEach(function(ev){
//       ev.multi_date = Mul.getMultiDates(ev);
//     });
//     var eids = [];
//     evs.forEach(function(ev) {
//       eids.push(parseInt(ev.eid));
//     });
//     Ev.updateMultiple(eids);
//   });
// }
// function updatePopular() {
//   var date = new Date();

//   date.setSeconds(0);
//   date.setMinutes(0);
//   date.setHours(0);

//   Events.find({
//     end_time: {
//       $gte: date
//     }
//   }, {
//     sort: {
//       'attending_count': -1
//     },
//     limit: 50
//   }).success(function(evs) {
//     var eids = [];

//     evs.forEach(function(ev) {
//       eids.push(parseInt(ev.eid));
//     });

//     Ev.updateMultiple(eids);
//   }).error(function(err) {
//     console.log(err);
//   });
// }

// function updateWeek() {
//   var date = new Date();

//   date.setSeconds(0);
//   date.setMinutes(0);
//   date.setHours(0);

//   var datePlusWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);

//   Events.find({
//     end_time: {
//       $gte: date,
//       $lt: datePlusWeek
//     }
//   }).success(function(evs) {
//     var eids = [];

//     evs.forEach(function(ev) {
//       eids.push(parseInt(ev.eid));
//     });

//     Ev.updateMultiple(eids);
//   }).error(function(err) {
//     console.log(err);
//   });
// }

// function updatePrioritaires() {
//   var date = new Date();

//   date.setSeconds(0);
//   date.setMinutes(0);
//   date.setHours(0);

//   var datePlusWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);

//   Users.find({}).success(function(users) {
//     var uids = [];

//     users.forEach(function(user) {
//       uids.push(parseInt(user.facebook.id));
//     });

//     Events.find({
//       end_time: {
//         $gte: date
//       },
//       attending: {
//         $in: uids
//       }
//     }).success(function(evs) {
//       var eids = [];

//       evs.forEach(function(ev) {
//         eids.push(parseInt(ev.eid));
//       });

//       Ev.updateMultiple(eids);
//     }).error(function(err) {
//       console.log(err);
//     });
//   });
// }

function paginate(page, term) {
  graph.get(page, function(err, res) {
    if (res) {
      if (res.paging && res.paging.next) {
        paginate(res.paging.next, term);
      }

      var evs = res.data;

      if (evs) {
        var eids = [];

        evs.forEach(function(ev) {
          eids.push(parseInt(ev.id));
        });

        Ev.fetchMultiple(eids, term, function(eves) {});
      }
    }
  });
}

function fetchEventsFromKeywords() {
  global.keywords.forEach(function(keyword) {
    fetchEventsFromKeyword(keyword);
  });
}

function fetchEventsFromKeyword(term) {
  var searchOptions = {
    q: term,
    type: 'event',
    limit: 5000,
  };

  var options = {
    // timezone: "Europe/Paris",
    since: 'now'
  };

  graph.search(searchOptions, function(err, res) {
    if (err) {
      console.log(err);
      return;
    }

    if (res.data) {
      // if (res.data.length) {
        // if (res.paging && res.paging.next) {
        //   paginate(res.paging.next, term);
        // }

        var evs = res.data;

        // var eids = [];

        evs.forEach(function(ev) {
          // eids.push(parseInt(ev.id));
          // eids = _.uniq(eids);
          Ev.fetch(ev.id, term, function(eves) {});
        });

        // Ev.fetchMultiple(eids, term, function(eves) {});
      // }
    }
  });
}

// function fetchEventsFromUsers() {
//   Creators.find({}).each(function(creator) {
//     Ev.getFromUser(creator.username, null, false, function() {});
//   });

//   Users.find({}).each(function(user) {
//     Ev.getFromUser(user.username, null, false, function() {});
//   });
// }

// function fetchEventsFromLocations() {
//   Locations.find({}).each(function(location) {
//     fetchEventsFromKeywords(location.location);
//   });
// }
