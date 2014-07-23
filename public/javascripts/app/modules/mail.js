define(function () {
    'use strict';

    //include deps
    var KO = require('knockout'),
        app = require('app'),
        _ = require('underscore');

    //default values
    var _defaults = {
        folders: [
            {title: 'Inbox', nid: 0},
            {title: 'Sent', nid: 0},
            {title: 'Archive', nid: 'archive'}
        ]
    };

    // Folders section
    var foldersMeta = {
        default: _defaults.folders,
        mixin: function(){
            this.setActive = function(o, e){
                KO.postbox.publish('setActiveTab', o.title);
                KO.postbox.publish('gridViewBool', true);
            };
            this.activeTab = KO.observable('Inbox').subscribeTo('setActiveTab');
            this.createMessage = function(){
                var saveResponse = app.Ajx({
                    url: 'api/node.json',
                    method: 'POST',
                    token: true,
                    data: JSON.stringify({
                        "title": "test create reference",
                        "type": "mail_message",
                        "body":{
                            "und": [
                                {"value":"post body value"}
                            ]
                        },
                        "field_message_status": {
                            "und":[
                                {"target_id":"[nid:6]"}
                            ]
                        },
                        "field_sender_position":{
                            "und":[
                                {"target_id":"[nid:11]"}
                            ]
                        },
                        "field_sender_organization":{
                            "und":[
                                {"target_id":"[nid:1]"}
                            ]
                        },
                        "field_sender_user":{
                            "und":[
                                {"target_id":"[nid:6]"}
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
            this.choosenMail = KO.observable().publishOn('pickMessage');
            this.gridView = KO.observable(true).subscribeTo('gridViewBool');
        }
    };
    var _MailGridVM = app.Widget('list', mailGridMeta)
        .init('/api/mail_letters.json');

    KO.applyBindings(_MailGridVM, document.querySelector('#mails-grid'));


    // Single mail section
    var singleMailMeta = {
        baseUrl: 'api/message',
        mixin: function(){
            var self = this;
            self.messageData = KO.observable(null);
            self.messageView = KO.computed({
                read: function(){
                    if(_MailGridVM.gridView()){
                        _MailGridVM.choosenMail(null);
                        self.messageData(null);
                    }
                    return !_MailGridVM.gridView();
                },
                write: function (value) {
                    _MailGridVM.gridView(!value);
                    return value;
                }
            });
            self.loadMessage = function(data){
                if(data){
                    var reqMessage = self.load(data.nid);
                    reqMessage.done(function(res){
                        self.messageData(JSON.parse(res)[0]);
                        self.messageView(true);
                    });
                }
            };
            KO.postbox.subscribe("pickMessage", self.loadMessage);
        }
    };

    var _SingleMailVM = app.Widget('rest', singleMailMeta);
    KO.applyBindings(_SingleMailVM, document.querySelector('#single-mail'));



    return {
        start: function(){console.log('mail started')}
    };
});