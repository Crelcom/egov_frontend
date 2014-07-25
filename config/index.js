// modules
var nconf = require('nconf');
var path = require('path');

// include config file
nconf.argv()
    .env()
    .file({ file: path.join(__dirname, 'config.json') });

module.exports = nconf;