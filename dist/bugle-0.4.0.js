/**
 *	Bugle-js v0.4.0 => event-driven publish-subscribe javascript api
 **/
;(function (module) {

	'use strict';

	//+ _is :: (any, string) -> boolean
	var _is = function(entity, type) {
		return Object.prototype.toString.call(entity).slice(8, -1) === type;
	},

	//+ _truhty :: any -> object -> boolean
	_truthy = function(entity) {

		return  {
			'obj': function() {
				return (_is(entity, 'Object') && Object.keys(entity).length);
			},

			'string': function() {
				return (_is(entity, 'String') && entity.length);
			},

			'number': function() {
				return (
				entity && _is(entity, 'Number') 
				&& entity !== Infinity
				&& entity !== -Infinity
				);
			},

			'fun': function() {
				return _is(entity, 'Function');
			},

			'array': function() {
				return (_is(entity, 'Array') && entity.length);
			}
		};	
	},

	//+ _generate :: (object,object) -> object
	_generate = function(methods, parent) {
		// extend an object with another objects properties/state
		// returns a new object, leaving both methods & parent untouched

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

	//+ _async :: function -> undefined
	_async = function(fn) {
		// force fn to be async
		setTimeout(fn, 0);
	},

	_error = {
		// convenience object for throwing helpful errors

		'subUsage': function() {
			return 'USAGE [ topic:String, scope:Object ]';
		},

		'pubUsage': function() {
			return 'UASGE [ topic:String[, message1:Any[, message2:Any[, ..]]] ]';
		},

		'unsubUsage': function() {
			return 'USAGE [ topic:String, instance:Subscriber ]';
		},

		'pubError': function(topic, error) {
			return 'Failed to publish to obj on topic "' + 
				topic + '" [' + error.message + ']';
		},

		'extendUsage': function() {
			return 'argument to Bugle extend must be an object literal';
		}
	},

	//+ _compose :: array(function) -> function -> any
	_compose = function() {
		var fns = Array.prototype.slice.call(arguments);

		return arr => {
			return fns.reduce((arg, fn, index) => {
				return fn.call(this, arg, index, arr);
			}, arr);
		};
	},

	//+ _flatten :: array -> array
	// e.g. [[1,2,3,4,5], [4,5,6]] -> [1,2,3,4,5,4,5,6]	
	_flatten = function(arr) {
		return arr.reduce((prev, curr) => {
			var isArr = _truthy(curr).array();
			return prev.concat(isArr? _flatten(curr) : curr);
		}, []);
	},

	//+ _map :: function -> array -> array
	_map = function(fn) {
		return function(arr) {
			return arr.reduce((prev, curr) => {
				return prev.concat([fn.call(this, curr)]);
			}, []);
		};
	},

	//+ _filter :: function -> array -> array
	_filter = function(pred) {
		return function(arr) {
			return arr.reduce((prev, curr) => {
				return pred.call(this, curr)? prev.concat([curr]): prev;
			}, []);
		};
	},

	//+ reject :: function -> array -> array
	_reject = function(pred) {
		
		var rejectBy = function(curr) {
			return !pred.call(this, curr); 
		};

		return function(arr) {
			return _filter(rejectBy).call(this, arr);
		}
	},

	//+ _flatMap :: function -> array -> array
	_flatMap = function(fn) {
		// map each message over function, 
		// flatten each message item w/o joining
		return function(arr) {
			return _compose.call(
				this, 
				_map(fn), 
				_map(_flatten)
			)(arr);
		};
	},

	//+ _squash :: array -> array
	_squash = function(arr) {
		return [_flatten.call(this, arr)];
	},

	//+ _receive :: function,array -> unit
	_receive = function(fn) {
		return function(arr) {
			fn.apply(this, [].concat(arr));
		};
	},

	//+ _dispatch :: (string, any, Subscriber) -> undefined
	_dispatch = function(topic, data, subscriber) {

		// apply current sub object and pub args to sub function
		_async(() => { 
			try {
				subscriber.digest(data);
			} catch(e) {
				throw _error.pubError(topic, e);
			}
		});
	},

	//+ _publish :: string [, any[, ...]] -> undefined
	_publish = function(topic) {
		// notify all subscribers of a topic with a message(s)

		if(_truthy(topic).string()) {

			var args = Array.prototype.slice.call(arguments, 1),
			channelItem = _dispatch.bind(null, topic, args);
			
			// publish args to each subscriber on topic
			if(this.topics[topic]) {
				var subscribers = this.topics[topic];
				subscribers.forEach(channelItem);
			}
		} else {
			throw _error.pubUsage();
		}
	},

	//+ _subscribe :: (string, function, object) -> Subscriber
	_subscribe = function(topic, scope) {
		// subscribe a function to a topic
		// with a given scope (defaults to current Bugle instance)

		scope = scope? scope : this;

		if(_truthy(topic).string()) {
		
			if(!this.topics[topic]) {
				this.topics[topic] = [];
			}

			var subscriber = new Subscriber(++this.oId, scope);
			this.topics[topic].push(subscriber);

			return subscriber;

		} else {
			throw _error.subUsage();
		}
	},

	//+ _unsubscribe :: string, Subscriber -> undefined
 	_unsubscribe = function(topic, subscriber) {
		// removes a subscriber object from the subscriptions list

		if(subscriber 
		&& _truthy(subscriber.oId).number()
		&& _truthy(topic).string()
		) {

			var subscribers = this.topics[topic],
			oId = subscriber.oId,

			// probably wont stay...
			maybeRemove = function(subscriber, index) {
				if(subscriber.oId === oId) subscribers.splice(index, 1);
			};
			
			if(subscribers) {
				_async(() => {
					subscribers.forEach(maybeRemove);
				});
			}

		} else {
			throw _error.unsubUsage();
		}
	},

	// extends the current bugle instance prototype with properties
	_extend = function(methods) {

		if(_truthy(methods).obj()) {
			return _generate(methods, this);
		} else {
			throw _error.extendUsage();
		}
	};

	// holds all user topics & reference to next unique subscriber id
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

	// holds the state of each new subscription on a topic
	function Subscriber(id, obj) {
		this.oId = id;
		this.obj = obj;

		// holds all fns to reduce over published data
		this._pipeline_ = [];
	}

	Subscriber.prototype = {

		//+ map :: function -> Subscriber
		'map': function(fn) {
			this._pipeline_.push(_map(fn));
			return this;
		},
		
		//+ filter :: function -> Subscriber
		'filter': function(pred) {
			this._pipeline_.push(_filter(pred));
			return this;
		},

		'reject': function(pred) {
			this._pipeline_.push(_reject(pred));
			return this;
		},

		//+ flatMap :: function -> Subscriber
		'flatMap': function(fn) {
			this._pipeline_.push(_flatMap(fn));
			return this;
		},

		//+ squash :: undefined -> Subscriber
		'squash': function() {
			this._pipeline_.push(_squash);
			return this;
		},
		
		//+ receive :: function -> undefined
		'receive': function(fn) {
			this._pipeline_.push(_receive(fn));
		},

		//+ digest :: array -> undefined
		'digest': function(data) {
			
			// take published data, 
			// reduce over pipelined functions
			if(_truthy(this._pipeline_).array()) {
				_compose.apply(this.obj, this._pipeline_)(data);
			}
		}
	};

	module['extend'] = function(methods) {
		return Bugle().extend(methods);
	}

} )(typeof module !== 'undefined' && module.exports? module.exports : window.Bugle = {});