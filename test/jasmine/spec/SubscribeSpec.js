
describe('subscribe', function() {

	'use strict';

	var TEST_NAMESPACE = 'subTest',

	SUB_ERROR_MSG = 'USAGE [ topic:String, object:Object, toCall:String ]',

	bugle,

	// returns the REAL type of some value
	type = function(val) {
		return Object.prototype.toString.call(val).slice(8, -1);
	},

	// build n number of Any type
	// returns as Array
	build = function(n, operation) {
		
		function _build(curr, arr) {
			
			if(curr === 0) return arr;

			return _build(--n, arr.concat(operation))
		}

		return _build(n, []);
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
				this.sub(TEST_NAMESPACE, this.update);
			},

			'update': function(a, b) {
				this.a = a;
				this.b = b;
			}

		})(1,2);
	});

	it('should start with an empty state', function() {

		expect(bugle.oId).toBe(0);
		expect(bugle.topics).toEqual([]);
	});

	it('expects a string topic namespace as its 1st parameter', function() {
		expect(bugle.sub(TEST_NAMESPACE, function() {})).toBeTruthy();

		try {
			bugle.sub(null, function() {});
		} catch(e) {
			expect(e).toBe(SUB_ERROR_MSG);
		}
	});

	it('can subscribe an anonymous function to a topic', function() {

		bugle.sub(TEST_NAMESPACE, function() { });

		var values = topic(TEST_NAMESPACE),
		topicLen = values.len(),
		sub = values.take(1)[0];

		expect(topicLen).toBe(1);
		expect(type(sub.done)).toBe('Function');
	});

	it('can subscribe a named function to a topic', function() {
		
		function namedTest() {};

		bugle.sub(TEST_NAMESPACE, namedTest);

		var named = topic(TEST_NAMESPACE),
		len = named.len(),
		sub = named.take(1)[0];

		expect(len).toBe(1);
		expect(type(sub.done)).toBe('Function');
	});

	it('can subscribe an object method to a topic', function() {

		// subscribe bugle to 'values' topic
		bugle.listen();

		var values = topic(TEST_NAMESPACE),
		topicLen = values.len(),
		sub = values.take(1)[0];

		expect(topicLen).toBe(1);
		expect(type(sub.done)).toBe('Function');

	});

	it('returns a subscriber reference serves as users handle for later unsubscribe', 
	function() {
		var reference = bugle.sub('oId', function() { });
		expect(type(reference.oId)).toBe('Number');
	});

	it('can have multiple subscriptions to a topic', function() {
		
		/** SETUP **/
		var SAMPLE_LENGTH = 100,
		SUBSET_LENGTH = 50,

		// subscribes each test function to 'multiples' topic
		fns = build(SAMPLE_LENGTH, function() {}),
		refs = fns.map(function(testFn) { 
			return bugle.sub(TEST_NAMESPACE, testFn); 
		});

		// get length of the topic & take a subset for testing
		var multiples = topic(TEST_NAMESPACE),
		len = multiples.len(),
		sample = multiples.take(SUBSET_LENGTH);

		/** TEST(s) **/

		expect(len).toBe(SAMPLE_LENGTH);

		for(var ith = 0; ith < SUBSET_LENGTH; ith++) {

			expect(type(sample[ith].oId)).toBe('Number');

			// reference in 'sample' should equal its corresponding value in 'oIds'
			expect(sample[ith].oId).toBe(refs[ith].oId);

			// each 'sample' member should contain a valid function
			expect(type(sample[ith].done)).toBe('Function');
		}
	});
});