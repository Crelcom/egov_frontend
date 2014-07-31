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
            self.title = KO.observable();
            self.bodyLetter = KO.observable();
            self.saveLetter = function(form){
                console.log(app.User())
                var letter = {
                    title: self.title(),
                    type: "mail_message",
                    body: ' "und":[ {"target_id":' + self.bodyLetter() + '}]',
                    field_message_position:' "und":[ {"target_id":' + self.items() + '}]',
                    field_sender_organization:' "und":[ {"target_id":' + app.User().position_organization + '}]',
                    field_sender_user: ' "und":[ {"target_id":' + app.User().name + '}]',
                    field_sender_position: ' "und":[ {"target_id":' + app.User().position_short_name + '}]'
                }
                console.log(letter);
                letter = KO.mapping.toJSON(letter);
                self.save(letter).done(function(){
                    form.reset();
                    self.items([]);
                    app.href('/grid/fold=Inbox');
                });
            };
            self.filters = KO.observableArray([]).subscribeTo('myModal:data');
            self.chosenItems =  KO.observableArray([]);
            self.items = KO.observableArray([]);
            self.check = function () {
                self.items.pushAll(self.chosenItems());
                self.reset();
            };
            self.reset = function(){
                self.chosenItems([]);
                self.filters(self.myModal.body);
                self.activeFilters.position_organization('');
                self.activeFilters.position_full_name('');
                self.activeFilters.user_full_name('');
            };
            self.label = function(e){
                if(self.chosenItems().indexOf(e)== -1){
                    self.chosenItems.push(e);
                }
                else{
                    self.chosenItems.splice(self.chosenItems.indexOf(e),1);
                }
            };
            self.deleteElement = function(e){
                self.items.splice(self.items.indexOf(e),1);
            };
            self.activeFilters = {
                position_organization:KO.observable(),
                position_full_name : KO.observable(),
                user_full_name:KO.observable()
            };
            self.setActiveFilter = function(){
                var obj = KO.mapping.toJS(self.activeFilters);
                obj = _.each(obj,function(val, ind){
                    if (!val) delete obj[ind];
                });
                if ($.isEmptyObject(obj) === false){
                    self.filters(self.filter(obj, self.filters()));
                }
                else{
                    self.filters(self.myModal.body);
                }
            };
        }
    };
    var _NewMailVM = app.Widget('list', newMailMeta).extend('rest', {baseUrl: 'api/node'});
    KO.applyBindings(_NewMailVM, document.querySelector('#newmail'));

    return {
        start: function(){console.log('mail started')},
        default: defaults
    };
});