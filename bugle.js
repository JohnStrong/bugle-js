;( function() {
	
	'use strict';

	// validation util functions
	const _assert = {
		
		'is': function(methods, type) {
			return Object.prototype.toString.call(methods).slice(8, -1) === type;
		},

		// apply type checking to a collection
		'areAll': function(items, type) {
		
			for(var item in items) {

				if(!this.is(items[item], type)) {
					return false;
				}
			}

			return true;
		},
	},

	// extend an object with another objects properties/state
	// returns a new object, leaving both source & destination untouched
	_extend = function(methods, parent) {

		var Builder = function() {

			if(!(this instanceof Builder)) {

				return new Builder(arguments);
			}

			this._super.apply(this, arguments);
			this._init.apply(this, arguments);
		};


		// attach pub, sub & unsub
		Builder.prototype = parent.prototype;

		// handle to object parent's constructor
		Builder.prototype._super = parent;

		// attach all custom methods to the Bugle object
		for(var method in methods) {
			Builder.prototype[method] = methods[method];
		}

		// when no init found, assume an empty constructor
		if(!Builder.prototype._init) {
			Builder.prototype._init = function() { };
		}

		return Builder;
	},

	// ensures the we get 'true' sync behaviour 
	_async = function(fn) {
		setTimeout(fn, 0);
	},


	// convenience object for throwing helpful errors
	_error = {

		'sub': function() {
			return 'USAGE [ topic:String, object:Object, toCall:String ]';
		},

		'pub': function() {
			return 'UASGE [ topic:String, data:Array[Any...] ]';
		},

		'unsub': function() {
			return 'USAGE [topic:String, oId:Number]';
		},

		'pubError': function(topic, error) {
			return 'Failed to publish to instance on topic "' + 
				topic + '" [' + error.message + ']';
		},

		'notAnObject': function() {
			return 'argument to Bugle must be a literal object';
		}
	},

	// apply current sub object and pub args to sub function
	_publishTo = function(topic, data) {

		return function(subscriber) {
				
			try {
				subscriber
					.fn.apply(subscriber.instance, data.concat(topic));

			} catch(e) {

				_async(function() { 
					throw _error.pubError(topic, e); 
				});
			}
		}
	},

	// notify all objects subscribed to the given topic with the data received
	_publish = function(topic) {

		var self = this;

		if(_assert.is(topic, 'String')) {

			var args = Array.prototype.slice.call(arguments, 1);

			// publish args to each subscriber on topic
			_async(function() {
				
				if(self.topics[topic]) {

					var topicLine = self.topics[topic];
					topicLine.forEach(_publishTo(topic, args));
				}
			});

		} else {

			throw _error.pub();
		}
	},

	// subscribe an object instance to a topic, execute with the 'toCall' function
	_subscribe = function(topic, instance, toCall) {
		
		// verify that param #1 & #3 are of type String
		var areString = _assert.areAll([topic, toCall], 'String'),

		// instance should be of type Object
		isObject = _assert.is(instance, 'Object');

		if(areString && isObject) {
		
			if(!this.topics[topic]) {
				this.topics[topic] = [];
			}

			this.topics[topic].push({
				'oId': (++this.oId),
				'instance': instance,
				'fn': instance[toCall]
			});

			return this.oId;

		} else {

			throw _error.sub();
		}
	},

	// remove an object from the subscriptions list on a topic with its assigned oId
	_unsubscribe = function(topic, oId) {

		var self = this;
		
		if(_assert.is(topic, 'String')) {

			_async(function() {

				var topicLine = self.topics[topic];
				
				if(topicLine) {
				
					// loop for specified oId until we get a match
					for(var index in topicLine) {

						if(topicLine[index].oId === oId) {
							topicLine.splice(index, 1);
							return;
						};
					}
				}
			});

		} else {

			throw _error.unsub();
		}
	};

	function Bugle() {

		// if no 'new' keyword specified by user
		if(!(this instanceof Bugle)) {

			return new Bugle();
		}

		// holds each topic along with its subscribers
		this.topics = [];
		
		// tracks the location of an object instance on a topic
		this.oId = 0;
	}

	Bugle.prototype = {
		
		pub: _publish,

		sub: _subscribe,

		unsub: _unsubscribe
	};

	window.Bugle = function(methods) {

		// check for option arg
		if(arguments.length) {

			// verify stateful & of type Object
			if(_assert.is(methods, 'Object')) {
				return _extend(methods, Bugle);

			} else {

				throw _error.notAnObject();
			}
		}

		return Bugle();
	};

} )();