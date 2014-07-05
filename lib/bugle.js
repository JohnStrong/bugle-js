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
			}
		};	
	},

	//+ _compose :: array(function) -> function -> any
	_compose = function() {
		var fns = Array.prototype.slice.call(arguments),
		self = this;

		return function(arg) {

			return fns.reduce(function(arg, fn) {
				return fn.call(self, arg);
			}, arg);
		};
	},

	//+ _remove :: (array, number) -> array
	_remove = function(array, target) {
		return array.splice(target, 1);
	},

	//+ _find :: (function, array) -> any
	_find = function(pred, col) {

		if(!col || !col.length) {
			return new TypeError('empty collection');
		}

		if(!_is(pred, 'Function')) {
			return new TypeError('predicate must be a function');
		}

		var len = col.length;

		// loop over collection until we satisfy the predicate
		for(var ith = 0; ith < len; ith++) {
			if(pred(col[ith])) return col[ith];
		}
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

		'sub': function() {
			return 'USAGE [ topic:String, object:Object, toCall:String ]';
		},

		'pub': function() {
			return 'UASGE [ topic:String[, data1:Any[, data2:Any[, ..]]] ]';
		},

		'unsub': function() {
			return 'USAGE [topic:String, reference:Subscriber]';
		},

		'pubError': function(topic, error) {
			return 'Failed to publish to obj on topic "' + 
				topic + '" [' + error.message + ']';
		},

		'notAnObject': function() {
			return 'argument to Bugle extend must be a literal object';
		}
	},

	//+ _pipeEvents :: object -> object -> function -> array
	_pipeEvents = {

		'map': function(fn) {
			
			return function(arr) {
				var len = arr.length;

				for(var ith = 0; ith < len; ith++) {
					arr[ith] = fn.call(this, arr[ith]);
				}

				return arr;
			};
		},

		'filter': function(pred) {
			
			return function(arr) {
				var len = arr.length,
				filtered = [];

				for(var ith = 0; ith < len; ith++) {
					if(pred.call(this, arr[ith])) {
						filtered.push(arr[ith]);
					}
				}

				return filtered;
			};
		}
	},

	//+ _dispatch :: (string, any, Subscriber) -> undefined
	_dispatch = function(topic, data, subscriber) {
		// apply current sub object and pub args to sub function
		try {
			subscriber.digest(data);
		} catch(e) {
			_async(function() { 
				throw _error.pubError(topic, e); 
			});
		}
	},

	//+ _publish :: string [, any[, ...]] -> undefined
	_publish = function(topic) {
		// notify all subscribers of a topic with a message(s)

		var self = this;

		if(_truthy(topic).string()) {

			var args = Array.prototype.slice.call(arguments, 1),
			channelItem = _dispatch.bind(null, topic, args);

			// publish args to each subscriber on topic
			_async(function() {

				if(self.topics[topic]) {
					var subscribers = self.topics[topic];
					subscribers.forEach(channelItem);
				}
			});
		} else {
			throw _error.pub();
		}
	},

	//+ _subscribe :: (string, function, object) -> Subscriber
	_subscribe = function(topic, onDone, scope) {
		// subscribe a function to a topic
		// with a given scope (defaults to current Bugle instance)

		scope = scope? scope : this;

		if(_truthy(topic).string()) {
		
			if(!this.topics[topic]) {
				this.topics[topic] = [];
			}

			var subscriber = new Subscriber(++this.oId, onDone, scope);
			this.topics[topic].push(subscriber);

			return subscriber;

		} else {
			throw _error.sub();
		}
	},

	//+ _unsubscribe :: string, Subscriber -> undefined
 	_unsubscribe = function(topic, subscriber) {
		// remove an object from the subscriptions list on a topic

		var self = this,

		findOid = function(subscriber) {
			return subscriber.oId === oId;
		};

		if(subscriber 
		&& _truthy(subscriber.oId).number()
		&& _truthy(topic).string()
		) {

			var oId = subscriber.oId,
			subscribers = self.topics[topic];

			if(subscribers) {
				_async(function() {
					
					_compose(
						_find.bind(null, findOid),
						_remove.bind(null, subscribers)
					)(subscribers);
				});
			}

		} else {
			throw _error.unsub();
		}
	},

	// extends the current bugle instance prototype with properties
	_extend = function(methods) {

		if(_truthy(methods).obj()) {
			return _generate(methods, this);
		} else {
			throw _error.notAnObject();
		}
	},

	//+ pipe :: string,function -> Subscriber
	_pipe = function(evnt, fn) {
		
		if(_truthy(evnt).string() && _truthy(fn).fun()) {
			
			var maybeEvent = _pipeEvents[evnt];

			if(maybeEvent) {
				this._pipeline_.push(maybeEvent(fn));
			} else {
				console.log('no event matching - ' + evnt);
			}

		} else {
			console.log('pipe fail');
		}

		return this;
	},

	//+ digest :: array -> undefined
	_digest = function(data) {
		// take published data, 
		// reduce over pipelined hofs
		// call done

		if(this._pipeline_) {
			var appliers = this._pipeline_.concat(this.done);
			_compose.apply(this.obj, appliers)(data);
		} else {
			this.done.apply(this.obj, data);
		}

		return this;
	};

	// holds the state of each new subscription on a topic
	function Subscriber(id, fn, obj) {
		this.oId = id;
		this.done = fn;
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