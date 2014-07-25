define(function(){
    'use strict';

    //include deps
    var KO = require('knockout'),
        app = require('app'),
        _ = require('underscore');

    var testVM = {
        title: 'Hello test'
        //showPopup: KO.observable().publishOn('openPopup')
    };
    //KO.postbox.subscribe('openPopup', function(){
      //  KO.bindingHandlers.popup.update(document.querySelector('#test-popup'), function(){return {};}, {}, testVM);
    //});

    //KO.applyBindings(testVM, document.querySelector('#test-popup'));

    return {
        start: function(){

        }
    }
});
