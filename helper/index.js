var _ = require('../public/bower_components/underscore/underscore');

module.exports = function(helpers) {
    var helpersObject = {};
    _.each(helpers, function(helper) {
        helpersObject[helper] = require('./' + helper);
    });
    return helpersObject;
};