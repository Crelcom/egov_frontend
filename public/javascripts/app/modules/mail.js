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
            this.createNewMessage = function(){
                this.fold('New Message');
                app.href('/new');
            };
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

    // New mail section
    var newMailMeta = {
        viewName: 'new',
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
                    app.hash('/grid/fold=Inbox');
                });
            };
            self.chosenItems =  KO.observableArray([]);
            self.check = function () {
                for (var i=0; i<self.body.length; i++){
                    for(var j=0; j< self.chosenItems().length;j++){
                        if(self.body[i].nid == self.chosenItems()[j]){
                                 self.items.push(self.body[i]);
                                 
                        }
                    }
                }
            };
           /* self.chosenFunc = KO.computed(
                {
                    read: function(){self.chosenItems()},
                    write: function(){console.log('write')}
                }
            )*/
            self.reset = function(){
                self.items([]);
                self.chosenItems([]);
            }
            self.label = function(e){
                console.log(e.nid);
                if(self.chosenItems().indexOf(e.nid)== -1){
                    self.chosenItems.push(e.nid);
                }
                else{
                    self.chosenItems.splice(self.chosenItems.indexOf(e.nid),1);
                }
            }
        }
    };
    var _NewMailVM = app.Widget('rest', newMailMeta);
    KO.applyBindings(_NewMailVM, document.querySelector('#newmail'));

    return {
        start: function(){console.log('mail started')},
        default: defaults
    };
});