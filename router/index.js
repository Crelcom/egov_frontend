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
            checkCookies(req, function(err, data){
                var module = req.params.module;
                if(err && module !== 'login'){
                    res.redirect('/login');
                }else{
                    // @todo check if module exist
                    res.render(module);
                }
            });
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
                options = {
                    url: url,
                    headers: {
                        'Cookie': req.headers.cookie,
                        'Content-Type': 'application/json'
                    }
//                    headers: req.headers
                },
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
                headers = {'Cookie': req.headers.cookie, 'Content-Type': 'application/json'},
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
                options = {
                    url: url,
                    headers: {
                        'Cookie': req.headers.cookie,
                        'Content-Type': 'application/json'
                    }
    //                    headers: req.headers
                },
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