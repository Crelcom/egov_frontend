requirejs.config({
    baseUrl: 'javascripts/app',
    paths: {
        knockout: '../../bower_components/knockout/dist/knockout',
        punches: '../../bower_components/knockout.punches/knockout.punches.min',
        mapping: '../../bower_components/knockout-mapping/build/output/knockout.mapping-latest',
        postbox: '../../bower_components/knockout-postbox/build/knockout-postbox.min',
        dispatch: '../../bower_components/dispatch/dispatch',
        underscore: '../../bower_components/underscore/underscore',
        deferred: '../../bower_components/simply-deferred/deferred.min',
        text: '../../bower_components/requirejs-text/text'
    },
    shim: {
        underscore: {
            exports: '_'
        }
    }
});

requirejs([ 'knockout',
            'punches',
            'mapping',
            'postbox',
            'text',
            'app' ],

    function(ko, punches, mapping, postbox, text, app){
        'use strict';

        // init KO functionality
        ko.punches.enableAll();
        ko.bindingHandlers.stopBinding = {
            init: function () {
                return { controlsDescendantBindings: true };
            }
        };
        ko.bindingHandlers.selected = {
            update: function(element, valueAccessor, allBindings, viewModel, bindingContext){
                if(bindingContext.$root.activeTab() === viewModel[valueAccessor()]){
                    return ko.bindingHandlers.css.update(element, function(){return 'active';});
                }else {
                    return ko.bindingHandlers.css.update(element, function(){return '';});
                }
            }
        };
        ko.observableArray.fn.pushAll = function(valuesToPush) {
            var underlyingArray = this();
            this.valueWillMutate();
            ko.utils.arrayPushAll(underlyingArray, valuesToPush);
            this.valueHasMutated();
            return this;  //optional
        };
        ko.virtualElements.allowedBindings.stopBinding = true;

        // start app module
        app.start();
    }
);