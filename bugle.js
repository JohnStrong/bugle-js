window.Bugle = ( function() {
	
	'use strict';

	// validation util functions
	const _verify = {
		
		'is': function(obj, type) {
			return Object.prototype.toString.call(obj).slice(8, -1) === type;
		},

		'areAll': function(items, type) {
		
			var status = false,
				self = this;

			items.forEach(function(item) {
				status = self.is(item, type);
			});

			return status;
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
		};

		return {

			'failedToPublish': function(topic, error) {
				throwError('Failed to publish to instance on topic "' + 
					topic + '" [' + error.message + ']')
			},

			'InvalidTopicType': function() {
				throwError('first paren, "topic", must be of type String');
			},

			'InvalidinstanceType': function() {
				throwError('instance value being pushed to topic must be of type Object');
			}
		};

	})();

	// Bugle function constructor
	function Bugle() {

		// holds each topic along with its subscribers
		this.topics = [];

		// tracks the location of an object instance on a topic
		this.oId = 0;
	}

	Bugle.prototype = {
		
		// pub some data to a topic
		// notify all objects subscribed to the given topic with the data received
		pub: function(topic, data) {

			var args = [data, topic],

			emit = () => {

				if(this.topics[topic]) {

					var topicLine = this.topics[topic];

					// execute each topic in topic line in order
					topicLine.forEach(function(subscriber, index) {
						
						args.push(index);

						try {

							// apply current sub object and pub args to sub function
							subscriber.fn.apply(subscriber.instance, args);

						} catch(e) {

							_async(function() { 
								_throwable.failedToPublish(topic, e); 
							});
						}

					});
				}
			},

			isTopicString = _verify.is(topic, 'String');
			
			if(isTopicString) {

				_async(function() { emit(); });

			} else {

				_throwable.InvalidTopicType();
			}

			return true;
		},

		// sub an instance to a topic using a given toCall function to execute on pub
		sub: function(topic, instance, toCall) {
			
			// verify that param #1 & #3 are of type String
			var areString = _verify.areAll([topic, toCall], 'String'),

			// verify instance is an Object
			isObject = _verify.is(instance, 'Object');

			if(areString) {
			
				if(isObject) {

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
					_throwable.InvalidinstanceType();
				}

			} else {

				_throwable.InvalidTopicType();
			}
		},

		// remove an object from the subscriptions list on a topic with its assigned oId
		unsub: function(topic, oId) {
			
			var isTopicString = _verify.is(topic, 'String'),

			unsub = () => {

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

			if(isTopicString) {

				_async(function() { unsub(); });

			} else {

				_throwable.InvalidTopicType();
			}
		}
	};

	// user does not have to specify that silly 'new' keyword
	return function(props) {
		return new Bugle();
	};

} )();