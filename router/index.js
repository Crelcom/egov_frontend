// modules
var _ = require('../public/bower_components/underscore/underscore'),
    proxy = require('request'),
    config = require('../config'),
    helper = require('../helper')(['router']);

module.exports = function(express){
    // router instance
    var router = express.Router();

    // main page route
    router.get('/', function(hRequest, hResponse, next){
        helper['router'].isLoggedIn(hRequest, hResponse, function() {
            hResponse.render('index');
        });
    });

    // universal module loader
    router.route('/:module')
        .get(function(hRequest, hResponse, next) {
            var module = hRequest.params.module;

            if (module === 'admin') {
                helper['router'].directProxy(hRequest, hResponse, next);
            } else {
                helper['router'].isLoggedIn(hRequest, hResponse, function() {
                    // @todo check if module exist
                    hResponse.render(module);
                }, function() {
                    if (module !== 'login') {
                        hResponse.redirect('/login')
                    } else {
                        hResponse.render('login');
                    }
                });
            }
        });

    // for requests to rest-server
    router.route('/api/*')
        .all(function(hRequest, hResponse, next){
            var params = helper['router'].getRequestParameters(hRequest);

            helper['router'].isLoggedIn(hRequest, hResponse, function() {
                helper['router'].directProxy(hRequest, hResponse, next).form(params);
            }, function () {
                if (hRequest.url !== '/api/user/login') {
                    next({status: 401, message: 'You must authorize'});
                }
                else {
                    helper['router'].directProxy(hRequest, hResponse, next).form(params);
                }
            });
        });

    // for requests to create node page
    router.route('/node/add*')
        .all(function(hRequest, hResponse, next) {
            helper['router'].adminProxy(hRequest, function() {
                helper['router'].directProxy(hRequest, hResponse, next);
            }, function() {
                next({status: 401, message: 'You must authorize'});
            });
        });

    // for requests to drupal admin pages
    router.route('/admin/*')
        .all(function(hRequest, hResponse, next) {
            var params = helper['router'].getRequestParameters(hRequest);
            helper['router'].directProxy(hRequest, hResponse, next).form(params);
        });

    return router;
};