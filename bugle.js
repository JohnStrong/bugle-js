;(function () {

	'use strict';

	// validation util functions
	const _assert = {
		
		'is': function(methods, type) {
			return Object.prototype.toString.call(methods).slice(8, -1) === type;
		},

		// apply type checking to a collection
		'areAll': function(items, type) {
			
			for(var ith = 0, len = items.length;  ith < len; ith++) {

				if(!this.is(items[ith], type)) {
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
			this._constructor.apply(this, arguments);
		};


		// attach pub, sub & unsub
		Builder.prototype = parent.prototype;

		// handle to object parent's constructor
		Builder.prototype._super = parent;

		// attach all custom methods to the Bugle object
		for(var method in methods) {
			if(methods.hasOwnProperty(method)) {
				Builder.prototype[method] = methods[method];
			}
		}

		// when no init found, assume an empty constructor
		if(!Builder.prototype._constructor) {
			Builder.prototype._constructor = function() { };
		}

		return Builder;
	},

	// ensures the we get 'true' sync behavior 
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
			return 'Failed to publish to obj on topic "' + 
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
					.fn.apply(subscriber.obj, data.concat(topic));

			} catch(e) {

				_async(function() { 
					throw _error.pubError(topic, e); 
				});
			}
		};
	},

	// notify all objects subscribed to the given topic with the data received
	_publish = function(topic) {

		var self = this;

		if(_assert.is(topic, 'String')) {

			var args = Array.prototype.slice.call(arguments, 1);

			// publish args to each subscriber on topic
			_async(function() {
				
				if(self.topics[topic]) {

					var subscribers = self.topics[topic],
					template = _publishTo(topic, args);

					subscribers.forEach(template);
				}
			});

			return true;

		} else {

			throw _error.pub();
		}
	},

	// subscribe a function to a topic
	// with a given scope (defaults to current Bugle instance)
	_subscribe = function(topic, toCall, scope) {
		
		scope = scope? scope : this;

		// verify that param #1 & #3 are of type String
		var isTopicString = _assert.is(topic, 'String'),

		// scope should be of type Object
		isScopeObject = _assert.is(scope, 'Object');

		if(isTopicString && isScopeObject) {
		
			if(!this.topics[topic]) {
				this.topics[topic] = [];
			}

			this.topics[topic].push({
				'oId': (++this.oId),
				'obj': scope,
				'fn': toCall
			});

			return this.oId;

		} else {

			throw _error.sub();
		}
	},

	// remove an object from the subscriptions list on a topic with its assigned oId
	_unsubscribe = function(topic, oId) {

		var self = this,

		isTopicString = _assert.is(topic, 'String'),
		isOidNumber = _assert.is(oId, 'Number');
				
		if(isTopicString && isOidNumber) {

			var subscribers = self.topics[topic];

			if(subscribers) {

				var len = subscribers.length;
				
				_async(function() {
					
					// loop for specified oId until we get a match
					for(var ith = 0; ith < len; ith++) {

						if(subscribers[ith].oId === oId) {
							subscribers.splice(ith, 1);
							break;
						}
					}
				});

				return true;

			} else {

				return false;
			}

		} else {

			throw _error.unsub();
		}
	};

	function Bugle() {

		//removes the need for 'new' keyword
		if(!(this instanceof Bugle)) {
			return new Bugle();
		}

		// holds each topic along with its subscribers
		this.topics = [];

		// tracks the location of an object obj on a topic
		this.oId = 0;
	}

	Bugle.prototype = {
		
		'pub': _publish,

		'sub': _subscribe,

		'unsub': _unsubscribe
	};

	window.Bugle = {

		'extend': function(methods) {

			// check for option arg
			if(methods && Object.keys(methods).length) {

				// verify methods is of type Object
				if(_assert.is(methods, 'Object')) {
					return _extend(methods, Bugle);

				} else {

					throw _error.notAnObject();
				}
			}
		}
	};

} )();