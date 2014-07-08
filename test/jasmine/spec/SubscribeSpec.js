
describe('subscribe', function() {

	'use strict';

	var TEST_NAMESPACE = 'subTest',

	SUB_ERROR_MSG = 'USAGE [ topic:String, scope:Object ]',

	bugle, topicHandle;

	beforeEach(function() {
		
		bugle = Bugle.extend({
			
			'_constructor': function(a, b) {
				this.a = a;
				this.b = b;
			},

			'listen': function() {
				return this.sub(TEST_NAMESPACE);
			},

			'update': function(a, b) {
				this.a = a;
				this.b = b;
			}

		})(1,2);

		topicHandle = util.topic(bugle);
	});

	beforeEach(function() {
		jasmine.clock().install();
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('should start with an empty state', function() {

		expect(bugle.oId).toBe(0);
		expect(bugle.topics).toEqual([]);
	});

	it('expects a string topic namespace as its 1st parameter', function() {
		expect(bugle.sub(TEST_NAMESPACE)).toBeTruthy();

		try {
			bugle.sub(null);
		} catch(e) {
			expect(e).toBe(SUB_ERROR_MSG);
		}
	});

	it('can pipe anonymous function to receive event in pipeline', function() {

		var ref = bugle.sub(TEST_NAMESPACE);

		expect(ref._pipeline_.length).toBe(0);

		ref.receive(function() { });

		expect(ref._pipeline_.length).toBe(1);
		expect(util.type(ref._pipeline_[0])).toBe('Function');
	});

	it('can subscribe a named function to a topic', function() {
		
		var ref = bugle.sub(TEST_NAMESPACE);

		expect(ref._pipeline_.length).toBe(0);

		ref.receive(namedFunction);

		expect(ref._pipeline_.length).toBe(1);
		expect(util.type(ref._pipeline_[0])).toBe('Function');

		function namedFunction() { };
	});

	it('can subscribe from an object method to a topic', function() {

		// subscribe bugle to 'values' topic
		var ref = bugle.listen();

		expect(ref.oId).toBe(1);
		expect(ref._pipeline_.length).toBe(0);

		ref.receive(bugle.update);

		expect(ref._pipeline_.length).toBe(1);
		expect(util.type(ref._pipeline_[0])).toBe('Function');

	});

	it('can subscribe with a custom scope', function() {
		var ref = bugle.sub(TEST_NAMESPACE, bugle);

		ref.receive(function(data1, data2) {
			this.a = data1;
			this.b = data2;
		});

		bugle.pub(TEST_NAMESPACE, 'a', 'b');

		util.tick(100);

		expect(bugle.a).toBe('a');
		expect(bugle.b).toBe('b');


	});

	it('returns a subscriber reference serves as users handle for later unsubscribe', 
	function() {
		var reference = bugle.sub('oId');
		expect(util.type(reference.oId)).toBe('Number');
	});

	it('can have multiple subscriptions to a topic', function() {
		
		/** SETUP **/
		var SAMPLE_LENGTH = 100,
		SUBSET_LENGTH = 50,

		// subscribes each test function to 'multiples' topic
		fns = util.build(SAMPLE_LENGTH, function() {}),
		refs = fns.map(function() { 
			return bugle.sub(TEST_NAMESPACE); 
		});

		// get length of the topic & take a subset for testing
		var multiples = topicHandle(TEST_NAMESPACE),
		len = multiples.len(),
		sample = multiples.take(SUBSET_LENGTH);

		/** TEST(s) **/

		expect(len).toBe(SAMPLE_LENGTH);

		for(var ith = 0; ith < SUBSET_LENGTH; ith++) {
			expect(util.type(sample[ith].oId)).toBe('Number');
			expect(sample[ith].oId).toBe(refs[ith].oId);
			expect(sample[ith]._pipeline_.length).toBe(0);
		}
	});
});