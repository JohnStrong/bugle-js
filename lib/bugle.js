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

	//+ _compose :: array(function) -> function -> any
	_compose = function() {
		var fns = Array.prototype.slice.call(arguments);

		return arr => {
			return fns.reduce((arg, fn, index) => {
				return fn.call(this, arg, index, arr);
			}, arr);
		};
	},

	//+ flatten :: array -> array
	// e.g. [[1,2,3,4,5], [4,5,6]] -> [1,2,3,4,5,4,5,6]	
	_flatten = function(arr) {
		return arr.reduce((prev, curr) => {
			var isArr = _truthy(curr).array();
			return prev.concat(isArr? _flatten(curr) : curr);
		}, []);
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
			return 'USAGE [ topic:String, object:Object, toCall:String ]';
		},

		'pubUsage': function() {
			return 'UASGE [ topic:String[, data1:Any[, data2:Any[, ..]]] ]';
		},

		'unsubUsage': function() {
			return 'USAGE [topic:String, reference:Subscriber]';
		},

		'pubError': function(topic, error) {
			return 'Failed to publish to obj on topic "' + 
				topic + '" [' + error.message + ']';
		},

		'extendUsage': function() {
			return 'argument to Bugle extend must be a literal object';
		},

		'pipeUsage': function() {
			return 'USAGE [ event:String, fn:Function ]';
		},

		'unknownPipeEvent': function(evnt) {
			return 'invalid pipe event [' + evnt + '], could not add to pipeline';
		}
	},

	//+ _pipeEvents :: object -> object -> function -> array
	_pipeEvents = {

		//+ map :: function -> array -> array
		'map': function(fn) {
			
			return function(arr) {
				return arr.reduce((prev, curr) => {
					return prev.concat([fn.call(this, curr)]);
				}, []);
			};
		},

		//+ filter :: function -> array -> array
		'filter': function(pred) {
			
			return function(arr) {
				return arr.reduce((prev, curr) => {
					return pred.call(this, curr)? prev.concat([curr]): prev;
				}, []);
			};
		},

		//+ flatMap :: function -> array -> array
		'flatMap': function(fn) {

			return function(arr) {

				// map array over accumulator fn, 
				// flatten each array item into single array
				return _compose.call(
					this, 
					_pipeEvents.map(fn), 
					_pipeEvents.map(_flatten)
				)(arr);
			};
		},
		
		//+ done :: function -> array -> undefined
		'done': function(fn) {

			return function(arr) {
				fn.apply(this, [].concat(arr));
			}
		}
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

		var self = this;

		if(_truthy(topic).string()) {

			var args = Array.prototype.slice.call(arguments, 1),
			channelItem = _dispatch.bind(null, topic, args);
			
			// publish args to each subscriber on topic
			if(self.topics[topic]) {
				var subscribers = self.topics[topic];
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
	},

	//+ pipe :: string,function -> Subscriber
	_pipe = function(evnt, fn) {
		
		if(_truthy(evnt).string() && _truthy(fn).fun()) {
			
			var maybeEvent = _pipeEvents[evnt];

			if(maybeEvent) {
				this._pipeline_.push(maybeEvent(fn));
			} else {
				throw _error.unknownPipeEvent(evnt);
			}

		} else {
			throw _error.pipeUsage();
		}

		return this;
	},

	//+ digest :: array -> undefined
	_digest = function(data) {
		// take published data, 
		// reduce over pipelined hofs
		if(_truthy(this._pipeline_).array()) {
			_compose.apply(this.obj, this._pipeline_)(data);
		}
	};

	// holds the state of each new subscription on a topic
	function Subscriber(id, obj) {
		this.oId = id;
		this.obj = obj;

		// holds all fns to reduce over published data
		this._pipeline_ = [];
	}

	Subscriber.prototype = {
		'pipe': _pipe,
		'digest': _digest
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

	module['extend'] = function(methods) {
		return Bugle().extend(methods);
	}

} )(typeof module !== 'undefined' && module.exports? module.exports : window.Bugle = {});