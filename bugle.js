;( function() {
	
	'use strict';

	// validation util functions
	const _assert = {
		
		'is': function(obj, type) {
			return Object.prototype.toString.call(obj).slice(8, -1) === type;
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
		}
	},

	_publish = function(topic) {

		// get user arguments to the function call
		var args = Array.prototype.slice.call(arguments, 1),

		self = this,

		// apply current sub object and pub args to sub function
		publishTo = (subscriber) => {
					
			try {
				subscriber.fn.apply(subscriber.instance, args.concat(topic));
			} catch(e) {

				_async(function() { 
					throw _error.pubError(topic, e); 
				});
			}

		};

		if(_assert.is(topic, 'String')) {

			// publish args to each subscriber on topic
			_async(function() {
				
				if(self.topics[topic]) {

					var topicLine = self.topics[topic];
					topicLine.forEach(publishTo);
				}
			});

			return true;

		} else {

			throw _error.pub();
		}
	},

	_subscribe = function(topic, instance, toCall) {
		
		// verify that param #1 & #3 are of type String
		var areString = _assert.areAll([topic, toCall], 'String'),

		// verify instance is an Object
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

	_unsubscribe = function(topic, oId) {
		
		var unsub = () => {

			if(this.topics[topic]) {
				
				var topicLine = this.topics[topic];

				// loop for specified oId until we get a match
				for(var index in topicLine) {

					if(topicLine[index].oId === oId) {
						topicLine.splice(index, 1);
						return;
					};
				}
			}
		};

		if(_assert.is(topic, 'String')) {

			_async(function() { unsub(); });

		} else {

			throw _error.unsub();
		}
	};

	function Bugle() {

		// if no 'new' keyword specified by user
		if(this instanceof Bugle) {

			// holds each topic along with its subscribers
			this.topics = [];
			// tracks the location of an object instance on a topic
			this.oId = 0;

		} else {

			return new Bugle();
		}
	}

	Bugle.prototype = {
		
		// notify all objects subscribed to the given topic with the data received
		pub: _publish,

		// subscribe an object instance to a topic, execute with the 'toCall' function
		sub: _subscribe,

		// remove an object from the subscriptions list on a topic with its assigned oId
		unsub: _unsubscribe
	};

	// extend a Bugle object with custom object properties
	const _extend = function(obj) {

		var Base = function() {

			if(this instanceof Base) {
			
				this.topics = [];
				this.oId = 0;

				this.init.apply(this, arguments);

			} else {
				return new Base(arguments);
			}
		};

		// attach pub, sub & unsub
		Base.prototype = Bugle.prototype;

		// attach all custom methods to the Bugle object
		for(var method in obj) {
			Base.prototype[method] = obj[method];
		}

		// when no init found, assume an empty constructor
		if(!Base.prototype.init) {
			Base.prototype.init = function() { };
		}

		return Base;
	}

	window.Bugle = function(obj) {

		// can extend the Bugle object with custom methods
		if(obj) {
			if(_assert.is(obj, 'Object')) {
				return _extend(obj);
			}
		}

		return Bugle();
	};

} )();