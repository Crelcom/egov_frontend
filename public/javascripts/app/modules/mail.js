define(function () {
    'use strict';

    //include deps
    var KO = require('knockout'),
        app = require('app'),
        _ = require('underscore');

    //default values
    var defaults = {
        folders: [
            {title: 'Inbox', nid: 0},
            {title: 'Sent', nid: 0},
            {title: 'Archive', nid: 'archive'}
        ],
        view: '/grid/fold=Inbox'
    };


    // Folders section
    var foldersMeta = {
        viewName: 'grid',
        default: defaults.folders,
        mixin: function(){
            this.fold = KO.observable('Inbox');
            this.createMessage = function(){
                var saveResponse = app.Ajx({
                    url: 'api/node.json',
                    method: 'POST',
                    token: true,
                    data: JSON.stringify({
                        "title": "test create reference qee",
                        "type": "mail_message",
                        "body":{
                            "und": [
                                {"value":"post body value"}
                            ]
                        },
                        "field_message_position": {
                            "und":[
                                {"target_id":"Первый заместитель (6)"}
                            ]
                        },
                        "field_sender_position":{
                            "und":[
                                {"target_id":"Первый заместитель (6)"}
                            ]
                        },
                        "field_sender_organization":{
                            "und":[
                                {"target_id":"Министерство экономразвития и торговли РК (5)"}
                            ]
                        },
                        "field_sender_user":{
                            "und":[
                                {"target_id":"test (5)"}
                            ]
                        }
                    })
                }).done(function(response){
                    console.log(response);
                });
            }
        }
    };
    var _FoldersVM = app.Widget('list', foldersMeta)
        .extend('rest', {baseUrl: 'api/node'})
        .init('/api/mail_folders.json');

    KO.applyBindings(_FoldersVM, document.querySelector('#mail-folders'));


    // Mails grid section
    var mailGridMeta = {
        mixin: function(){
            this.choosenMail = function(o, e){
                var path = '/message/loadID=' + o.nid;
                app.href(path);
            }
        }
    };
    var _MailGridVM = app.Widget('list', mailGridMeta)
        .init('/api/mail_letters.json');

    KO.applyBindings(_MailGridVM, document.querySelector('#mails-grid'));


    // Single mail section
    var singleMailMeta = {
        viewName: 'message',
        baseUrl: 'api/message',
        mixin: function(){
            var self = this;
            self.messageData = KO.observable(null);
            self.messageView = KO.computed(function(){
                    if(app.currentView() !== 'message'){
                        self.messageData(null);
                    }
                });
            self.loadID = function(data){
                if(data){
                    var reqMessage = self.load(data);
                    reqMessage.done(function(res){
                        self.messageData(JSON.parse(res)[0]);
                    });
                }
            };
        }
    };

    var _SingleMailVM = app.Widget('rest', singleMailMeta);
    KO.applyBindings(_SingleMailVM, document.querySelector('#single-mail'));



    return {
        start: function(){console.log('mail started')},
        default: defaults
    };
});