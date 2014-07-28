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
        ],
        view: 'grid'
    };

    app.currentView(_defaults.view);

    // Folders section
    var foldersMeta = {
        default: _defaults.folders,
        mixin: function(){
            this.setActive = function(o, e){
                KO.postbox.publish('setActiveTab', o.title);
                app.currentView('grid');
            };
            this.activeTab = KO.observable('Inbox').subscribeTo('setActiveTab');
            this.createNewMessage = function(){
                app.currentView('newmessage');
                /*var saveResponse = app.Ajx({
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
                });*/
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
            self.messageView = KO.computed(function(){
                    if(app.currentView() !== 'message'){
                        _MailGridVM.choosenMail(null);
                        self.messageData(null);
                    }
                });
            self.loadMessage = function(data){
                if(data){
                    var reqMessage = self.load(data.nid);
                    reqMessage.done(function(res){
                        self.messageData(JSON.parse(res)[0]);
                        app.currentView('message');
                    });
                }
            };
            KO.postbox.subscribe("pickMessage", self.loadMessage);
        }
    };

    var _SingleMailVM = app.Widget('rest', singleMailMeta);
    KO.applyBindings(_SingleMailVM, document.querySelector('#single-mail'));

    // New mail section
    var newMailMeta = {
        mixin: function(){
            var self = this;
            self.BoolCheck = KO.observable(false);
            self.obj = {
                header: KO.observable(),
                //sender: KO.observable(),
                body: KO.observable()
            };
            self.items = KO.observableArray();
            self.saveLetter = function(form){
                var letter = KO.mapping.toJSON(self.obj);
                self.save(letter).done(function(){
                    form.reset();
                    app.currentView('grid');
                });
            };
            self.chosenItems =  KO.observableArray([]);
            self.check = function (){
                for (var i=0; i<self.body.length; i++){
                    for(var j=0; j< self.chosenItems().length;j++){
                        if(self.body[i].nid == self.chosenItems()[j]){
                            self.items.push(self.body[i]);
                        }
                    }
                }
            };
            self.reset = function(){
                self.items([]);
                self.chosenItems([]);
            }
        }
    }
    var _NewMailVM = app.Widget('rest', newMailMeta);
    KO.applyBindings(_NewMailVM, document.querySelector('#newmail'));

    return {
        start: function(){console.log('mail started')}
    };
});