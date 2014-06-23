window.Bugle = ( function() {
	
	'use strict';

	// correct type checking
	const _is = function(obj, type) {
		return Object.prototype.toString.call(obj).slice(8, -1) === type;
	},

	// ensures the we get 'true' sync behaviour 
	async = function(fn) {
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
			}
		};

	})();


	// init function
	// empty topic list & starting oId
	function Bugle() {
		this.topics = [];
		this.oId = 0;
	}

	// publish some data to a topic
	// notify all objects subscribed to the given topic with the data received
	Bugle.prototype.publish = function(topic, data) {
		
		var isTopicString = _is(topic, 'String'),

		emit = () => {
			
			if(this.topics[topic]) {

				var topicLine = this.topics[topic];

				// execute each topic in topic line in order
				for(var index in topicLine) {

					var obj = topicLine[index];

					try {
						obj.fn.apply(obj.instance, [topic, data, index]);
					} catch(e) {

						async(function() { 
							_throwable.failedToPublish(topic); 
						});
					}
				}
			}
		};

		if(isTopicString) {
			async(function() { emit(); });
		} else {
			_throwable.InvalidTopicType();
		}

		return true;
	};

	// subscribe an object to a topic using a given toCall function to execute on publish
	// NOTE: will add validation for obj (object) & toCall (string)
	Bugle.prototype.subscribe = function(topic, obj, toCall) {
		
		var isTopicString = _is(topic, 'String');

		if(isTopicString) {
				
			if(!this.topics[topic]) {
				this.topics[topic] = [];
			}

			this.topics[topic].push({
				'oId': (++this.oId),
				'instance': obj,
				'fn': obj[toCall]
			});

			return this.oId;

		} else {
			_throwable.InvalidTopicType();
		}
	};


	// remove an object from the subscriptions list on a topic with its assigned oId
	Bugle.prototype.unsubscribe = function(topic, oId) {
		
		var isTopicString = _is(topic, 'String'),

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
			async(function() { unsub(); });
		} else {
			_throwable.InvalidTopicType();
		}

		return true;
	};

	// user does not have to specify that silly 'new' keyword
	return function() {
		return new Bugle();
	};

} )();