;(function (module) {

	'use strict';

	// validation util functions
	var _assert = {
		
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

	// added to simplify conditional code elsewhere
	// much to do, so little time...
	_truthy = {
		'obj': function(obj) {
			return ( obj
				&& _assert.is(obj, 'Object')  
				&& Object.keys(obj).length
			);
		}
	},

	// extend an object with another objects properties/state
	// returns a new object, leaving both methods & parent untouched
	_buildFrom = function(methods, parent) {

		// holds Builder arguments array
		var args,

		// allow us to cache arguments of the initial Builder call
		init = false,

		Builder = function() {

			// if first call, cache arguments
			if(!init) {
				args = arguments;
			}

			// builder is ready
			init = true;

			if(!(this instanceof Builder)) {
				return new Builder();
			}
			
			this._constructor.apply(this, args);
		};

		// attach parent members
		Builder.prototype = parent;

		// attach all method members to the Builder
		for(var method in methods) {
			if(methods.hasOwnProperty(method)) {
				Builder.prototype[method] = methods[method];
			}
		}

		// when no '_constructor' found, init an empty constructor
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
			return 'argument to Bugle extend must be a literal object';
		}
	},

	// apply current sub object and pub args to sub function
	_dispatch = function(topic, data, subscriber) {
		try {
			var msg = data.length? data.concat(topic) : [topic]
			subscriber.fn.apply(subscriber.obj, msg);
		} catch(e) {
			_async(function() { 
				throw _error.pubError(topic, e); 
			});
		}
	},

	// notify all subscribers of a topic with a message(s)
	_publish = function(topic) {

		var self = this;

		if(_assert.is(topic, 'String')) {

			var args = Array.prototype.slice.call(arguments, 1),
			channelItem = _dispatch.bind(null, topic, args);

			// publish args to each subscriber on topic
			_async(function() {

				if(self.topics[topic]) {

					var subscribers = self.topics[topic];
					subscribers.forEach(channelItem);
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
				
				_async(function() {

					var len = subscribers.length;
					
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
	},

	// extends the current bugle instance prototype with properties
	_extend = function(methods) {
		if(_truthy.obj(methods)) {
			return _buildFrom(methods, this);
		} else {
			throw _error.notAnObject();
		}
	};

	function Bugle() {

		//removes the need for 'new' keyword
		if(!(this instanceof Bugle)) {
			return new Bugle();
		}

		// holds topic namespaces along with its subscribers
		this.topics = [];

		// tracking id generated for each new subscription
		this.oId = 0;
	}

	Bugle.prototype = {
		
		'pub': _publish,

		'sub': _subscribe,

		'unsub': _unsubscribe,

		'extend': _extend
	};

	module['extend'] = function(methods) {
		return Bugle().extend(methods);
	}

} )(typeof module !== 'undefined' && module.exports? module.exports : window.Bugle = {});