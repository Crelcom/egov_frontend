// Requirements
var _ = require('../public/bower_components/underscore/underscore'),
    config = require('../config'),
    proxy = require('request');

// Helper function for getting request method
function getMethod(hRequest) {
    var methods = config.get('methods');
    return methods[hRequest.method]
}

// Helper function for direct proxing request to Drupal backend
function directProxy(hRequest, hResponse, next) {
    var method = getMethod(hRequest),
        url = fullUrl(hRequest.url),
        headers = getHeaders(hRequest);

    return proxy[method]({url: url, headers: headers}, function(error, response, body){
        if (error) {
            next(error);
        }
        hResponse.send(body);
    });
}

// Helper function for checking user is admin
function adminProxy(hRequest, success, fail) {
    var apiIsAdmin = fullUrl('/api/is_admin'),
        headers = getHeaders(hRequest);

    proxy['get']({url: apiIsAdmin, headers: headers}, function(err, response, body) {
        var is_admin = parseInt(body) || 0;

        if (is_admin) {
            success();
        } else {
            fail();
        }
    });
}

// Helper function for getting request parameters
function getRequestParameters(hRequest) {
    var params = {};

    if(hRequest.body && !_.isEmpty(hRequest.body)){
        _.each(hRequest.body, function(val, key){this[key] = val;}, params);
    }

    return params;
}

// Helper function for getting full url by relative url
function fullUrl(relUrl) {
    return config.get('backend') + relUrl;
}

// Helper function for checking user is logged in.
// If user is logged in - success callback will be called, otherwise fail callback is calling (if defined).
function isLoggedIn(hRequest, hResponse, success, fail) {
    var apiLoggedIn = fullUrl('/api/is_logged_in'),
        headers = getHeaders(hRequest);

    proxy['get']({url: apiLoggedIn, headers: headers}, function(error, response, body) {
        var loggedIn = parseInt(body);

        if (!error && loggedIn) {
            success();
        } else {
            fail = fail || null;

            if (!_.isFunction(fail) && hRequest.url !== '/login') {
                hResponse.redirect('/login');
            } else {
                fail();
            }
        }
    });
}

// Helper function to get needed headers
function getHeaders(hRequest) {
    var headers = {
        'Connection': hRequest.headers.connection,
        'Host': hRequest.headers.host,
        'User-Agent': hRequest.headers['user-agent'],
        'Content-Type': 'application/json'
    };
    if (!_.isEmpty(hRequest.headers.cookie)) {
        headers['Cookie'] = hRequest.headers.cookie;
    }
    if (!_.isEmpty(hRequest.headers['x-csrf-token'])) {
        headers['X-CSRF-Token'] = hRequest.headers['x-csrf-token'];
    }
    return headers;
}

// Exported methods
module.exports = {
   'directProxy': directProxy,
   'adminProxy': adminProxy,
   'getRequestParameters': getRequestParameters,
   'fullUrl': fullUrl,
   'isLoggedIn': isLoggedIn,
   'getHeaders': getHeaders,
   'getMethod': getMethod
};