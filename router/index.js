// modules
var _ = require('../public/bower_components/underscore/underscore'),
    proxy = require('request'),
    config = require('../config'),
    methods = {
        'GET': 'get',
        'POST': 'post',
        'PUT': 'put',
        'DELETE': 'delete'
    };

// Helper function for direct proxing request to Drupal backend
function directProxy(hRequest, hResponse, next) {
    var method = methods[hRequest.method],
        url = fullUrl(hRequest.url),
        headers = getHeaders(hRequest);

    return proxy[method]({url: url, headers: headers}, function(error, response, body){
        if (error) {
            next(error);
        }
        hResponse.send(body);
    });
}

// Helper function for proxing request if user is admin
function adminProxy(hRequest, callback) {
    var apiIsAdmin = fullUrl('/api/is_admin'),
        headers = getHeaders(hRequest),
        url = fullUrl(hRequest.url),
        method = methods[hRequest.method];

    return proxy['get']({url: apiIsAdmin, headers: headers}, function(err, response, body) {
        var is_admin = parseInt(body) || 0;

        if (is_admin) {
            proxy[method]({url: url, headers: headers}, callback);
        }
    });
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

// helper function to get needed headers
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

module.exports = function(express){
    // router instance
    var router = express.Router();

    // main page route
    router.get('/', function(hRequest, hResponse, next){
        isLoggedIn(hRequest, hResponse, function() {
            hResponse.render('index');
        });
    });

    // universal module loader
    router.route('/:module')
        .get(function(hRequest, hResponse, next) {
            var module = hRequest.params.module;

            if (module === 'admin') {
                directProxy(hRequest, hResponse, next);
            } else {
                isLoggedIn(hRequest, hResponse, function() {
                    // @todo check if module exist
                    hResponse.render(module);
                }, function() {
                    hResponse.render('login')
                });
            }
        });

    // for requests to rest-server
    router.route('/api/*')
        .all(function(hRequest, hResponse, next){
            var params = getRequestParameters(hRequest);

            isLoggedIn(hRequest, hResponse, function() {
                directProxy(hRequest, hResponse, next).form(params);
            }, function () {
                if (hRequest.url !== '/api/user/login') {
                    next(401, 'You must authorize');
                }
                else {
                    directProxy(hRequest, hResponse, next).form(params);
                }
            });
        });

    // for requests to create node page
    router.route('/node/add*')
        .all(function(hRequest, hResponse, next) {
            adminProxy(hRequest, function(error, response, body) {
                if (error) {
                    next(error);
                }
                hResponse.send(body);
            });
        });

    // for requests to drupal admin pages
    router.route('/admin/*')
        .all(function(hRequest, hResponse, next) {
            var params = getRequestParameters(hRequest);
            directProxy(hRequest, hResponse, next).form(params);
        });

    return router;
};