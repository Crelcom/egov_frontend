// config file for clients script
// define paths
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
        },
        dispatch: {
            exports: 'dispatch'
        }
    }
});

// first started module
// include KO dependency and run app.start()
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
        ko.mapping = mapping;

        // custom bindings
        ko.bindingHandlers.stopBinding = {
            init: function () {
                return { controlsDescendantBindings: true };
            }
        };
        ko.bindingHandlers.selected = {
            update: function(element, valueAccessor, allBindings, viewModel, bindingContext){
                if(bindingContext.$root.fold() === viewModel[valueAccessor()]){
                    return ko.bindingHandlers.css.update(element, function(){return 'active';});
                }else if(valueAccessor() === 'New Message' && bindingContext.$root.fold() === 'New Message'){
                    return ko.bindingHandlers.css.update(element, function(){return 'active';});
                }else{
                    return ko.bindingHandlers.css.update(element, function(){return '';});
                }
            }
        };
        ko.bindingHandlers.popup = {
            init: function(element, valueAccessor, allBindings, viewModel, bindContext){
                app.Ajx({
                    url: valueAccessor()
                }).done(function(response){
                    var target = element.dataset.target.replace(/#/, '');
                    viewModel[target] = {};
                    //viewModel[target].body = JSON.parse(response);
                    ko.postbox.publish(target +':data', JSON.parse(response));
                    viewModel[target].targetID = target;
                    var contain = document.body.appendChild(document.createElement("DIV"));
                    ko.renderTemplate('popup-tpl', viewModel, {}, contain, "replaceNode");
                });
            }
        };

        ko.bindingHandlers.viewSwitch = {
            update: function(element, valueAccessor, allBindings, viewModel, bindContext){
                var bool;
                if(app.currentView() === valueAccessor()){
                    bool = true;
                } else{
                    bool = false;
                }
                return ko.bindingHandlers.visible.update(element, function(){return bool;});
            }
        };

        ko.bindingHandlers.uniqueTemplate = {
            init: function(element, valueAccessor, allBindings, viewModel, bindContext){
                return ko.bindingHandlers.template.init(element, valueAccessor, allBindings, viewModel, bindContext);
            },
            update: function(element, valueAccessor, allBindings, viewModel, bindContext){
                var items = valueAccessor().foreach;
                items(_.unique(items()));
                return ko.bindingHandlers.template.update(element, valueAccessor, allBindings, viewModel, bindContext);
            }
        };
        ko.virtualElements.allowedBindings.uniqueTemplate = true;

        // expand observableArray - push array of items to observableArray
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