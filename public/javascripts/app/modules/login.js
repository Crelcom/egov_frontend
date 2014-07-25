define(function(){
    'use strict';

    //include deps
    var KO =require('knockout'),
        app = require('app');

    // view module
    var LoginVM = function(){
        var self = this;

        //submit handler for login form
        self.LoginSubmit = function(form){
            var params = {
                method: 'POST',
                url: '/api/user/login',
                data: JSON.stringify({
                    username: form.elements['username'].value,
                    password: form.elements['password'].value
                })
            };
            var Send = app.Ajx(params);
            Send.done(function(resp){
                var data = JSON.parse(resp);
                if(!data.sessid){
                    KO.postbox.publish('ErrorMessage', data);
                }else{
                    saveSession(data);
                    KO.postbox.publish('setUser', data.user);
                    app.go('/');
                }
            });
        };
    };

    // save session data to cookies
    function saveSession(data){
        // save cookie
        var d = new Date();
        d.setTime(d.getTime() + (7*24*60*60*1000));
        var expires = "expires="+d.toGMTString();
        document.cookie = data['session_name'] + "=" + data.sessid + "; " + expires + '; path=/';
        localStorage.TOKEN = data.token;
    }

    // start module
    function start(){
        KO.applyBindings(new LoginVM, document.querySelector('#login-form'));
    }



    return {
        start: start,
        metaData: {}
    };
});
