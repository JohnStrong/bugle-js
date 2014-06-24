window.Bugle = ( function() {
	
	'use strict';

	// validation util functions
	const _verify = {
		
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
	_throwable = (function() {

		var throwError = (message) => {
			throw message;
		},

		invalids = {
			'sub': 'USAGE [ topic:String, object:Object, toCall:String ]',
			'pub': 'UASGE [ topic:String, data:Array[Any...] ]',
			'unsub': 'USAGE [topic:String, oId:Number]'
		}

		return {

			'failedToPublish': function(topic, error) {
				throwError('Failed to publish to instance on topic "' + 
					topic + '" [' + error.message + ']')
			},

			'invalidArgs': function(invalid) {
				throwError(invalids[invalid]);
			}
		};

	})();

	function Bugle() {

		// holds each topic along with its subscribers
		this.topics = [];

		// tracks the location of an object instance on a topic
		this.oId = 0;
	}

	Bugle.prototype = {
		
	// notify all objects subscribed to the given topic with the data received
	pub: function(topic) {

		var args = Array.prototype.slice.call(arguments, 1),

		// apply current sub object and pub args to sub function
		publishTo = (subscriber) => {
					
			try {
				subscriber.fn.apply(subscriber.instance, args.concat(topic));
			} catch(e) {

				_async(function() { 
					_throwable.failedToPublish(topic, e); 
				});
			}

		},

		emit = () => {

			if(this.topics[topic]) {

				var topicLine = this.topics[topic];
				topicLine.forEach(publishTo);
			}
		};

		if(_verify.is(topic, 'String')) {

			_async(function() { emit(); });

		} else {

			_throwable.invalidArgs('pub');
		}

		return true;
	},

	// sub an instance to a topic using a given toCall function to execute on pub
	sub: function(topic, instance, toCall) {
		
		// verify that param #1 & #3 are of type String
		var areString = _verify.areAll([topic, toCall], 'String'),

		// verify instance is an Object
		isObject = _verify.is(instance, 'Object');

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
			_throwable.invalidArgs('sub');
		}
	},

	// remove an object from the subscriptions list on a topic with its assigned oId
	unsub: function(topic, oId) {
		
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

		if(_verify.is(topic, 'String')) {

			_async(function() { unsub(); });

		} else {

			_throwable.invalidArgs('unsub');
		}
	}

	};

	// user does not have to specify that silly 'new' keyword
	return function(props) {
		return new Bugle();
	};

} )();