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

// callback for validating cookies
function checkCookies(req, callback){
    // @todo validate cookie
    if(_.isEmpty(req.cookies) && req.params.module !== 'login'){
        callback('You must login to access!');
    }
    callback(null, true);
}

// helper function to get needed headers
function getHeaders(request) {
    var headers = {
        'Connection': request.headers.connection,
        'Host': request.headers.host,
        'User-Agent': request.headers['user-agent'],
        'Content-Type': 'application/json'
    }
    if (!_.isEmpty(request.headers.cookie)) {
        headers['Cookie'] = request.headers.cookie;
    }
    if (!_.isEmpty(request.headers['x-csrf-token'])) {
        headers['X-CSRF-Token'] = request.headers['x-csrf-token'];
    }
    return headers;
}

module.exports = function(express){
    // router instance
    var router = express.Router();

    // main page route
    router.get('/', function(req, res, next){
        checkCookies(req, function(err, data){
            if(err){
                res.redirect('/login');
            }else {
                res.render('index');
            }
        })
    });

    // universal module loader
    router.route('/:module')
        .get(function(req, res, next) {
            var module = req.params.module;
            var method = methods[req.method];

            if (module === 'admin') {
                var url = config.get('backend')+req.url;
                proxy[method]({url: url, headers: getHeaders(req)}, function(err, httpResponse, body) {
                    if (err) {
                        next(err);
                    }
                    res.send(body);
                });
            } else {
                checkCookies(req, function (err, data) {
                    if (err && module !== 'login') {
                        res.redirect('/login');
                    } else {
                        // @todo check if module exist
                        res.render(module);
                    }
                });
            }
        });


    // for requests to rest-server
    router.route('/api/*')
        .all(function(req, res, next){
            if(!req.headers.cookie && req.url !== '/api/user/login'){
                next(401, 'You must authorize');
            }
            var path = req.url,
                url = config.get('backend') + path,
                params = {},
                options = {url: url, headers: getHeaders(req)},
                meth = methods[req.method];

            if(req.body && !_.isEmpty(req.body)){
                _.each(req.body, function(val, key){this[key] = val;}, params);
            }

            proxy[meth](options, function(err, httpResponse, body){
                if (err) {
                    next(err);
                }
                res.send(body);
            }).form(params);
        });

    router.route('/node/add')
        .all(function(req, res, next) {
            var path = req.url,
                addUrl = config.get('backend') + path,
                isAdminUrl = config.get('backend') + '/api/is_admin',
                params = {},
                headers = getHeaders(req),
                method = methods[req.method],
                is_admin = 0;

            proxy['get']({url: isAdminUrl, headers: headers}, function(err, httpResponse, body) {
                if (err) {
                    next(err);
                }
                is_admin = parseInt(body);

                if (is_admin) {
                    proxy[method]({url: addUrl, headers: headers}, function(err, httpResponse, body) {
                        if (err) {
                            next(err);
                        }
                        res.send(body);
                    });
                }
            });
        });


    // for requests to drupal admin pages
    router.route('/admin/*')
        .all(function(req, res, next) {
            if(!req.headers.cookie){
                next(401, 'You must authorize');
            }
            var path = req.url,
                url = config.get('backend') + path,
                params = {},
                options = {url: url, headers: getHeaders(req)},
                meth = methods[req.method];

            if(req.body && !_.isEmpty(req.body)){
                _.each(req.body, function(val, key){this[key] = val;}, params);
            }

            proxy[meth](options, function(err, httpResponse, body){
                if (err) {
                    next(err);
                }
                res.send(body);
            }).form(params);
        });
    return router;
};