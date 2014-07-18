var _ = require('../public/bower_components/underscore/underscore'),
    proxy = require('request'),
    methods = {
        'GET': 'get',
        'POST': 'post',
        'PUT': 'put',
        'DELETE': 'delete'
    };

function checkCookies(req, callback){
    // @todo validate cookie
    if(_.isEmpty(req.cookies) && req.params.module !== 'login'){
        callback('You must login to access!');
    }
    callback(null, true);
}

module.exports = function(express){
    var router = express.Router();

    router.get('/', function(req, res, next){
        checkCookies(req, function(err, data){
            if(err){
                res.redirect('/login');
            }else {
                res.render('index');
            }
        })
    });

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
                url = 'http://replica.loc:9090' + path,
                params = {},
                options = {
                    url: url,
                    headers: {
                        'Cookie': req.headers.cookie,
                        'Content-Type': 'application/json'
                    }
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