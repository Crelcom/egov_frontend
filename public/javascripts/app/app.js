define(['underscore', 'deferred'], function(_, Deferred){
    'use strict';

    var KO = require('knockout');

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


    // Constructors:
    // Route constructor
    function _RouterConstructor(){
        // parse meta data and build hash-routes
        this.buildRoutes = function(meta){
            //fill routes
        };
        this.init();
    }
    _RouterConstructor.prototype.init = function(){
        // look to location path and load module and meta data for uiRouter
        var path = window.location.pathname.replace(/[\/]/g, ''),
            module = loadModule(path),
            self = this;
        if(module){
            module.done(
                function(module){
                    self.buildRoutes(module.metaData);
                    module.start();
                }
            );
        }
    };
    // Rest constructor
    function _RestConstructor(meta){
        var self = this;
        self.resource = meta.baseUrl;
        if(meta.mixin && typeof meta.mixin === 'function') meta.mixin.call(self);
    }
    _RestConstructor.prototype = {
        load: function(id){
            var self = this;
            var request = Ajax({
                url: '/' + self.resource + '.json',
                data: {id: id}
            });
            return request;
        }
    };
    // List constructor
    function _ListConstructor(meta){
        var self = this;
        if(meta.extend && typeof meta.extend.type === 'string'){
            KO.utils.extend(this, new _RestConstructor(meta.extend));
            KO.utils.extend(this, _RestConstructor.prototype);
        }
        self.data = KO.observableArray(meta.default || []);
        if(meta.mixin && typeof meta.mixin === 'function') meta.mixin.call(self);
    }
    _ListConstructor.prototype.init = function(url){
        url = this.resource || url;
        var initData = Ajax({
            method: 'GET',
            url: url
        });
        initData.done(
            function(resp){
                if(resp && resp !== '') this.data.pushAll(JSON.parse(resp) || []);
            }.bind(this)
        );
    };


    // Widget factory
    var widgetFactory = function(){
        var storage = {
            list: _ListConstructor,
            rest: _RestConstructor,
            route: _RouterConstructor
        };
        function Widget(){

        }
        Widget.prototype.get = function(name, data){
            if(storage[name] && typeof storage[name] === 'function') return new storage[name](data);
        };
        return new Widget();
    }();


    // view model for repeated page parts
    function _appVM(){
        var self = this,
            userData = localStorage.userData ? JSON.parse(localStorage.userData) : {name: 'Guest'};
        self.currentUser = KO.observable(userData).subscribeTo('setUser');
        self.userName = KO.computed(function(){
            var data = this.currentUser();
            return data.name;
        }, self);
        self.logout = function(){
            var name = document.cookie.split('=');
            document.cookie = name[0] + "=" + "; expires=Thu, 01 Jan 1970 00:00:01 GMT";
            location.reload();
        }
    }

    // load main module for current page
    function appStart(){
        var uiRouter = new _RouterConstructor();
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

    function go(path){
        // @todo escape from danger characters
        window.location.assign(path);
    }




    // interface
    return {
        start: appStart,
        loadModule: loadModule,
        Ajx: Ajax,
        go: go,
        Widget: widgetFactory
    }
});