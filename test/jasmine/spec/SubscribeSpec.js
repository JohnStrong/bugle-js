
describe('subscribe', function() {

	var bugle,

	// returns the REAL type of some value
	type = function(val) {
		return Object.prototype.toString.call(val).slice(8, -1);
	},

	// build n number of functions
	// returns array of created functions
	build = function(n, fn) {
		var arr = [];

		while(n) {
			arr.push(fn);
			n--;
		}

		return arr;
	},

	// pipe each function of an array to a 'handler' function
	pipe = function(actions) {

		return function(topic) {

			// take arguments and pass to our pipe handler
			var rem = Array.prototype.slice.call(arguments, 1),

			res = actions.map(function(action) {
				return action.apply(action, [topic].concat(rem));
			});

			// return piped result
			return res;
		};
	},

	topic = function(namespace) {
		
		var topic = bugle.topics[namespace];

		return {
			
			'len': function() {
				return topic.length;
			},

			'take': function(n) {
				return topic.splice(0, Math.min(this.len(), n));
			}
		};
	};

	beforeEach(function() {
		
		bugle = Bugle.extend({
			
			'_constructor': function(a, b) {
				this.a = a;
				this.b = b;
			},

			'listen': function() {
				this.sub('values', this.update)
			},

			'update': function(a, b) {
				this.a = a;
				this.b = b;
			}
		})(1,2);
	});

	it("should start with an empty state", function() {

		expect(bugle.oId).toBe(0);
		expect(bugle.topics).toEqual([]);
	});

	it("can subscribe an anonymous function to a topic", function() {

		bugle.sub('values', function() { });

		var values = topic('values'),
		topicLen = values.len(),
		sub = values.take(1)[0];

		expect(topicLen).toBe(1);
		expect(type(sub.fn)).toBe('Function');
	});

	it("can subscribe a named function to a topic", function() {
		
		function namedTest() {};

		bugle.sub('named', namedTest);

		var named = topic('named'),
		len = named.len(),
		sub = named.take(1)[0];

		expect(len).toBe(1);
		expect(type(sub.fn)).toBe('Function');
	});

	it("can subscribe an object method to a topic", function() {

		// subscribe bugle to 'values' topic
		bugle.listen();

		var values = topic('values'),
		topicLen = values.len(),
		sub = values.take(1)[0];

		expect(topicLen).toBe(1);
		expect(type(sub.fn)).toBe('Function');

	});

	it('returns an reference id (oId) for each new subscription', function() {
		var oId = bugle.sub('oId', function() { });
		expect(type(oId)).toBe('Number');
	});

	it('can have multiple subscriptions to a topic', function() {
		
		/** SETUP **/

		var SAMPLE_LENGTH = 100,
		SUBSET_LENGTH = 50,

		TOPIC_NAMESPACE = 'multiples';

		// subscribes each test function to 'multiples' topic
		var fns = build(SAMPLE_LENGTH, function() {}),
		oIds = fns.map(function(testFn) { 
			return bugle.sub(TOPIC_NAMESPACE, testFn); 
		});

		// get length of the topic & take a subset for testing
		var multiples = topic(TOPIC_NAMESPACE),
		len = multiples.len(),
		sample = multiples.take(SUBSET_LENGTH);

		/** TEST(s) **/

		expect(len).toBe(SAMPLE_LENGTH);

		for(var ith = 0; ith < SUBSET_LENGTH; ith++) {

			// oId in 'sample' should equal its corresponding value in 'oIds'
			expect(sample[ith].oId).toBe(oIds[ith]);

			// each 'sample' member should contain a valid function
			expect(type(sample[ith].fn)).toBe('Function');
		}
	});

	it("can unsubscribe an member from a topic with a valid oId", function() {

		var TOPIC_NAMESPACE = 'unsub';

		oId = bugle.sub(TOPIC_NAMESPACE, function() {});

		jasmine.clock().install();

		bugle.unsub(TOPIC_NAMESPACE, oId);

		// oId should not be unsubscribed yet (event is asynchronous)
		expect(bugle.topics[TOPIC_NAMESPACE].length).not.toBe(0);

		jasmine.clock().tick(10);

		// expect oId to now be unsubscribed
		expect(bugle.topics[TOPIC_NAMESPACE].length).toBe(0);

		jasmine.clock().uninstall();
	});

});