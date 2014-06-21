window.Bugle = ( function() {
	
	'use strict';

	const _is = function(obj, type) {
		
		var name = Object.prototype.toString.call(obj).slice(8, -1);
		return name === type;
	},

	_throwable = function(name, message) {
		
		var  throwable = {};

		throwable['name'] = name;
		throwable['message'] = message;

		return new Error(''.concat(name).concat(' => ').concat(message));
	};


	// init function
	// empty topic list & starting oId
	function Bugle() {
		this.topics = [];
		this.oId = 0;
	}

	// publish some data to a topic
	// notify all objects subscribed to the given topic with the data received
	Bugle.prototype.publish = function(topic, data) {
		
		var isTopicString = _is(topic, 'String');

		if(isTopicString) {
			
			if(this.topics[topic]) {

				this.topics[topic].forEach(function(obj, index) {
					obj['fn'].apply(obj['instance'], [topic, data, index]);
				});
			}

		} else {
			throw _throwable('invalidTopicType', 'in method publish, topic[args#1] must be a String');
		}
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
			throw _throwable('invalidTopicType',  'in method subscribe, topic[args#1] must be a String');
		}
	};


	// remove an object from the subscriptions list on a topic with its assigned oId
	Bugle.prototype.unsubscribe = function(topic, oId) {
		var isTopicString = _is(topic, 'String');

		if(isTopicString) {

			if(this.topics[topic]) {
				
				var topic = this.topics[topic];

				topic.forEach(function(obj, index) {
					if(obj.oId === oId) { 
						var spliced = topic.splice(index, 1);
					}
				});
			}
		}
	};

	// user does not have to specify that silly 'new' keyword
	return function() {
		return new Bugle();
	};

} )();