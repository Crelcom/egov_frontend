define(['underscore', 'deferred', 'dispatch'], function(_, Deferred, dispatch){
    'use strict';

    var KO = require('knockout');

    // current view and module
    var _module = {},
        _currentView = KO.observable();

    // views init
    _module._views = {};

    // async loads modules
    function loadModule(name){
        if(name && name !== ''){
            var dfr = new Deferred();
            require(['modules/'+name], function(module){
                dfr.resolve(module);
            });
            return dfr;
        }
        return false;
    }

    // look to location path and load module and get view from hash
    function _moduleInit(){
        var path = window.location.pathname.replace(/[\/]/g, ''),
            module = loadModule(path),
            hash = window.location.hash.replace(/#/, ''),
            self = this;
        if(module){
            module.done(function(module){
                KO.utils.extend(_module, module);
                _module.start();
                if(hash && hash !== ''){
                    dispatch.go(hash);
                }else if(_module.default){
                    dispatch.go(_module.default.view);
                }
            });
        }
    }

    // hash-router callback
    // set view and trigger method from url
    dispatch.on("/:view/:action", function(params) {
        _currentView(params.view);
        var viewParams = params.action.match(/(.+)=(.+)/),
            view = _module._views[params.view][viewParams[1]];

        typeof view === 'function' ? view(viewParams[2]) : view = viewParams[2];
    });
    // single path callback
    dispatch.on("/:view", function(params){
        _currentView(params.view);
    });

    // Constructors:

    // Rest constructor
    function _RestConstructor(meta){
        var self = this;
        self.resource = meta.baseUrl;
        self.load = function(id){
            var request = Ajax({
                url: '/' + self.resource + '.json',
                data: {id: id}
            });
            return request;
        };
        self.save = function(obj){
            var request = Ajax({
                url: '/api/node.json',
                method: 'POST',
                data: obj,
                token: true
            });
            return request;
        };
        self.update = self.delete = function(id, obj){
            var request = Ajax({
                url: '/api/node/' + id + '.json',
                method: 'PUT',
                data: obj,
                token: true
            });
            return request;
        };
        if(meta.mixin && typeof meta.mixin === 'function') meta.mixin.call(self);
    }

    // List constructor
    function _ListConstructor(meta){
        var self = this;
        self.data = KO.observableArray(meta.default || []);

        self.init = function(url){
            url = url || self.resource;
            var initData = Ajax({
                method: 'GET',
                url: url
            });
            initData.done(
                function(resp){
                    if(resp && resp !== '') self.data.pushAll(JSON.parse(resp) || []);
                }
            );
            return self;
        };
        self.filter = function(obj, arr){
            var data = arr || self.data;
            var filtered = _.filter(data, function(val){
                var res = _.reduce(obj, function(memo, value, key){
                    if(val[key].toLowerCase().indexOf(value.toLowerCase()) !== -1){
                        memo.push(1);
                    }else{
                        memo.push(0);
                    }
                    return memo;
                }, []);
                if(res.indexOf(0) === -1){
                    return true;
                }
            });
            return filtered;
        };
        // user can expand default properties from mixin
        if(meta.mixin && typeof meta.mixin === 'function') meta.mixin.call(self);
    }


    // Widget factory
    var widgetFactory = function(){
        var storage = {
            list: _ListConstructor,
            rest: _RestConstructor
        };
        function Widget(name, data){
            if (!(this instanceof Widget)) return new Widget(name, data);
            var self = this;
            if(storage[name] && typeof storage[name] === 'function'){
                storage[name].call(self, data);
            }
            if(data.viewName) _module._views[data.viewName] = self;
        }
        Widget.prototype.extend = function(type, data){
            var self = this;
            if(type && typeof type === 'string'){
                KO.utils.extend(self, new storage[type](data));
            }
            return self;
        };
        return Widget;
    }();

    var user =  KO.observable(localStorage.userData ? JSON.parse(localStorage.userData) : {name: 'Guest'}).syncWith('setUser');
    // view model for repeated page parts
    function _appVM(){
        var self = this;
        self.userName = KO.computed(function(){
            var data = user();
            return data.name;
        }, self);
        self.logout = function(){
            var name = document.cookie.split('=');
            document.cookie = name[0] + "=" + "; expires=Thu, 01 Jan 1970 00:00:01 GMT";
            localStorage.clear();
            go('/');
        }
    }

    // load main module for current page
    function appStart(){
        _moduleInit();
        KO.applyBindings(new _appVM());
    }


    // Utility functions for app:

    //wrapper for XHR
    function Ajax(params){
        var xhr = new XMLHttpRequest(),
            dfr = new Deferred(),
            method = params.method || 'GET',
            url = params.url || '/',
            data = params.data || {},
            status = params.status || 200;

        if(method === 'GET' && !_.isEmpty(data)){
            var toGet = _.reduce(data, function(res, val, key){
                return res + key + '=' + val + '&';
            }, '?');
            url += toGet;
        }

        xhr.open(method, url, true);
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                if(xhr.status === status){
                    dfr.resolve(xhr.response);
                }else{
                    dfr.reject('Error '+xhr.status);
                }
            }
        };
        //default header
        xhr.setRequestHeader('Content-Type', 'application/json');


        if(params.before && typeof params.before === 'function'){
            params.before(xhr);
        }
        if(params.token){
            xhr.setRequestHeader("X-CSRF-Token", localStorage.TOKEN);
        }
        xhr.send(data);
        return dfr;
    }

    var _errorMessage = function(){
        var out = document.createElement('div');
        out.classList.add('alert', 'alert-danger');
        return function(err){
            var el = out.cloneNode(true);
            el.textContent = err;
            return el;
        };
    }();

    KO.postbox.subscribe("ErrorMessage", function(err) {
        var block = document.querySelector('.main-content') || document.body;
        if(typeof err === 'string'){
            block.appendChild(_errorMessage(err));
        }else if(_.isArray(err) || _.isObject(err)){
            _.each(
                _.filter(err, function(val){return _.isString(val)}),
                function(val){this.appendChild(_errorMessage(val));},
                block
            )
        }
    });

    KO.postbox.subscribe('setUser', function(user){
        localStorage.userData = JSON.stringify(user);
    });

    // for modules
    function go(path){
        // @todo escape from danger characters
        window.location.assign(path);
    }
    // for views
    function href(path){
        dispatch.go(path);
    }
    // interface
    return {
        User: user,
        start: appStart,
        loadModule: loadModule,
        Ajx: Ajax,
        go: go,
        href: href,
        Widget: widgetFactory,
        currentView: _currentView
    }
});