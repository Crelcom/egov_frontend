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
        extend: {
            type: 'rest',
            baseUrl: '/api/mail_folders.json'
        },
        default: _defaults.folders,
        mixin: function(){
            this.setActive = function(o, e){
                KO.postbox.publish('setActiveTab', o.title);
                KO.postbox.publish('gridViewBool', true);
            };
            this.activeTab = KO.observable('Inbox').subscribeTo('setActiveTab');
        }
    };
    var _FoldersVM = app.Widget.get('list', foldersMeta);
    _FoldersVM.init();

    KO.applyBindings(_FoldersVM, document.querySelector('#mail-folders'));


    // Mails grid section
    var mailGridMeta = {
        mixin: function(){
            this.choosenMail = KO.observable().publishOn('pickMessage');
            this.gridView = KO.observable(true).subscribeTo('gridViewBool');
        }
    };
    var _MailGridVM = app.Widget.get('list', mailGridMeta);
    _MailGridVM.init('/api/mail_letters.json');

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

    var _SingleMailVM = app.Widget.get('rest', singleMailMeta);
    KO.applyBindings(_SingleMailVM, document.querySelector('#single-mail'));



    return {
        start: function(){console.log('mail started')}
    };
});