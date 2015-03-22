// Events routes use events controller
var events = require(controllersDir + 'events');
var authorization = require(middlewaresDir + 'authorization');

// Event authorization helpers
var hasAuthorization = function(req, res, next) {
  if (req.user.id === 1) {
    if (req.event.creator.id !== req.user.facebook.id) {
      return res.send(401, 'User is not authorized');
    }
  }
  next();
};

module.exports = function(app) {
  // app.get('/update', authorization.requiresLogin, hasAuthorization, events.updateAll);
  // app.get('/import/user/:name', authorization.requiresLogin, hasAuthorization, events.importFromUser);
  // app.get('/import/user/timeline/:name', authorization.requiresLogin, hasAuthorization, events.importFromUserTimeline);
  // app.get('/import/page/:pid', authorization.requiresLogin, hasAuthorization, events.importFromPage);
  // app.get('/import/page/timeline/:pid', authorization.requiresLogin, hasAuthorization, events.importFromPageTimeline);
  // app.get('/import/event/:eid', authorization.requiresLogin, hasAuthorization, events.import);
  app.get('/import/event/:eid', events.import);
  app.post('/api/geolocation', events.geolocation);
  app.get('/api/events', events.get);
  app.get('/api/events/:eid', events.getOne);
  // app.post('/api/event/update/:eid', events.updatePrice);
  // app.put('/api/events/:eid', authorization.requiresLogin, hasAuthorization, events.update);
  // app.post('/api/events/:eid', authorization.requiresLogin, hasAuthorization, events.create);
  // app.delete('/api/events', authorization.requiresLogin, hasAuthorization, events.destroy);
};