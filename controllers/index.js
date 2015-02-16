exports.render = function(req, res) {
  res.render('index', {
    title: 'quesale',
    user: req.user ? JSON.stringify(req.user) : 'null',
    fbAppId: global.fbAppId,
    //events: events,
    //pos: pos
  });
};