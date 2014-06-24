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
			throw new Error(message);
		};

		return {

			'failedToPublish': function(topic) {
				throwError('Failed to publish to instance on topic ' + topic);
			},

			'InvalidTopicType': function() {
				throwError('topic identifier must be of type String');
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
		
		// publish some data to a topic
		// notify all objects subscribed to the given topic with the data received
		publish: function(topic, data) {

			var emit = () => {

				if(this.topics[topic]) {

					var topicLine = this.topics[topic];

					// execute each topic in topic line in order
					for(var index in topicLine) {

						var obj = topicLine[index],
						args = [topic, data, index];

						try {
							obj.fn.apply(obj.instance, args);
						} catch(e) {

							_async(function() { 
								_throwable.failedToPublish(topic); 
							});
						}
					}
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

		// subscribe an instance to a topic using a given toCall function to execute on publish
		subscribe: function(topic, instance, toCall) {
			
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
		unsubscribe: function(topic, oId) {
			
			var isTopicString = _verify.is(topic, 'String'),

			unsub = () => {

				if(this.topics[topic]) {
					
					var topicLine = this.topics[topic];

					for(var index in topicLine) {

						var subscriber = topicLine[index];

						if(subscriber.oId === oId) {
							topicLine.splice(index, 1);
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