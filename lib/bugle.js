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

	//+ _compose :: array -> (array, object) -> any
	_compose = function(fns) {
		return function(arr, scope) {
			return fns.reduce(function(acc, fn, index) {
				return fn.call(scope, acc);
			}.bind(this), arr);
		};
	},

	//+ _flatten :: array -> array
	// e.g. [[1,2,3,4,5], [4,5,6]] -> [1,2,3,4,5,4,5,6]	
	_flatten = function(arr) {
		return arr.reduce(function(acc, curr) {
			var isArr = _truthy(curr).array();
			return acc.concat(isArr? _flatten(curr) : curr);
		}.bind(this), []);
	},

	//+ _map :: function -> array -> array
	_map = function(fn) {
		return function(arr) {
			return arr.map(function(item) {
				return fn.call(this, item);
			}.bind(this));
		};
	},

	//+ _filter :: function -> array -> array
	_filter = function(pred) {
		return function(arr) {
			return arr.filter(function(item) {
				return pred.call(this, item);
			}.bind(this));
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
			var flattened = _compose([_map(fn), _flatten])(arr, this);
			return [flattened];
		};
	},

	//+ _reduce :: (function,any) -> any
	_reduce = function(fn, acc) {
		
		return function(arr) {

			var accumulator = acc? acc : arr[0],

			reduced = arr.reduce(function(acc, curr) {
				return fn.call(this, curr, acc);
			}.bind(this), accumulator);

			return [reduced];
		}
	},

	//+ _reduceRight :: (function,any) -> any
	_reduceRight = function(fn, acc) {
		return function(arr) {
			arr.reverse();
			return _reduce(fn, acc).call(this, arr);
		}
	},

	//+ _squash :: array -> array
	_squash = function(arr) {
		// squash each message into a single sequence
		return [_flatten.call(this, arr)];
	},

	//+ _receive :: function,array -> unit
	_receive = function(fn) {
		// primary message handler
		// all messages should flow out through this handler
		return function(arr) {
			fn.apply(this, [].concat(arr));
		};
	},

	//+ _dispatch :: (string, any, Subscriber) -> undefined
	_dispatch = function(topic, data, subscriber) {
		
		// apply current sub object and pub args to sub function
		try {
			subscriber.digest(data);
		} catch(e) {
			throw _error.pubError(topic, e);
		}
	},

	//+ _publish :: string [, any[, ...]] -> undefined
	_publish = function(topic) {
		// notify all subscribers of a topic with a message(s)

		if(_truthy(topic).string()) {

			var args = Array.prototype.slice.call(arguments, 1),
			channelItem = _dispatch.bind(null, topic, args);
			
			// publish args to each subscriber on topic
			if(this.topics[topic]) {

				_async(function() {
					var subscribers = this.topics[topic];
					subscribers.forEach(channelItem);
				}.bind(this));
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
				_async(function() {
					subscribers.forEach(maybeRemove);
				}.bind(this));
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

			if(!_truthy(fn).fun()) {
				throw new TypeError('param[1] of "map" must be a function');
			}

			this._pipeline_.push(_map(fn));
			return this;
		},
		
		//+ filter :: function -> Subscriber
		'filter': function(pred) {

			if(!_truthy(pred).fun()) {
				throw new TypeError('param[1] of "filter" must be a function');
			}

			this._pipeline_.push(_filter(pred));
			return this;
		},

		'reject': function(pred) {

			if(!_truthy(pred).fun()) {
				throw new TypeError('param[1] of "reject" must be a function');
			}

			this._pipeline_.push(_reject(pred));
			return this;
		},

		//+ flatMap :: function -> Subscriber
		'flatMap': function(fn) {

			if(!_truthy(fn).fun()) {
				throw new TypeError('param[1] of "flatMap" must be a function');
			}

			this._pipeline_.push(_flatMap(fn));
			return this;
		},

		//+ squash :: undefined -> Subscriber
		'squash': function() {
			this._pipeline_.push(_squash);
			return this;
		},

		//+ reduce :: function -> Subscriber
		'reduce': function(fn, acc) {

			if(!_truthy(fn).fun()) {
				throw new TypeError('param[1] of "reduce" must be a function');
			}

			this._pipeline_.push(_reduce(fn, acc));
			return this;
		},

		//+ reduceRight :: function -> Subscriber
		'reduceRight': function(fn, acc) {

			if(!_truthy(fn).fun()) {
				throw new TypeError('param[1] of "reduceRight" must be a function');
			}

			this._pipeline_.push(_reduceRight(fn, acc));
			return this;
		},
		
		//+ receive :: function -> undefined
		'receive': function(fn) {
			
			if(!_truthy(fn).fun()) {
				throw new TypeError('param[1] of "receive" must be a function');
			}

			this._pipeline_.push(_receive(fn));
		},

		//+ digest :: array -> undefined
		'digest': function(data) {
			
			// take published data, 
			// reduce over pipelined functions
			if(_truthy(this._pipeline_).array()) {
				_compose(this._pipeline_)(data, this.obj);
			}
		}
	};

	module['extend'] = function(methods) {
		return Bugle().extend(methods);
	}

} )(typeof module !== 'undefined' && module.exports? module.exports : window.Bugle = {});