var users = require(controllersDir + 'users');

module.exports = function(app, passport) {
  // app.get('/auth/signin', users.signin);
  // app.get('/auth/signup', users.signup);
  // app.get('/auth/signout', users.signout);

  // app.get('/auth/facebook', function(req, res, next) {
  //   req.session.redirectUrl = req.query.redirectUrl;
  //   next();
  // }, passport.authenticate('facebook', {
  //   scope: ['email','create_event', 'rsvp_event', 'user_events', 'user_interests'],
  //   failureRedirect: '/signin'
  // }));
  // app.post('/auth/facebook/canvas', passport.authenticate('facebook-canvas', {
  //   scope: ['email','publish_actions' ,'user_about_me', 'create_event', 'rsvp_event', 'user_events', 'user_interests', 'user_likes']
  // }), users.authCallback);

  // app.get('/auth/facebook/canvas/autologin', function( req, res ){
  //   res.send( '<!DOCTYPE html>' +
  //               '<body>' +
  //                 '<script type="text/javascript">' +
  //                   'top.location.href = "/auth/facebook";' +
  //                 '</script>' +
  //               '</body>' +
  //             '</html>' );
  // });

  // app.get('/auth/facebook/callback', passport.authenticate('facebook-canvas', {
  //   failureRedirect: '/signin'
  // }), users.authCallback);

  // app.get('/:user/events', users.getEvents);
  // app.get('/api/me/events', users.getMyEvents);
  // app.get('/api/user/:uid', users.getOne);
  // app.get('/api/users/:uids/info', users.getInfo);
  // app.get('/api/users/:uid/picture', users.getPicture);
};