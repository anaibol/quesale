'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
  root: rootPath,
  port: process.env.PORT || 3000,
  // The secret should be set to a non-guessable string that
  // is used to compute a session hash
  sessionSecret: 'myprecious'
}