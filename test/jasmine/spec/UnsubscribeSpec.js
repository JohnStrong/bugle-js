
describe('unsubscribe', function() {
	
	'use strict';

	var TEST_NAMESPACE = 'unsubTest',

	UNSUB_ERROR_MSG = 'USAGE [ topic:String, instance:Subscriber ]',

	ASYNC_WAIT = 10,

	bugle,

	tick = function() {
		jasmine.clock().tick(ASYNC_WAIT);
	};

	beforeEach(function() {
		jasmine.clock().install();
	});

	beforeEach(function() {
		
		bugle = Bugle.extend({
			'_constructor': function() {}
		})();
	});

	afterEach(function() {
		jasmine.clock().uninstall();	
	});

	it('throws error if topic param is NOT a String', function() {
		
		var reference = bugle.sub(TEST_NAMESPACE);
	
		try {
			bugle.unsub(null, reference)
			tick();
		} catch(e) {
			expect(e.message).toBe(UNSUB_ERROR_MSG);
		}
	});

	it('throws error if reference param is NOT a Number', function() {
		var reference = bugle.sub(TEST_NAMESPACE);

		try {
			bugle.unsub(TEST_NAMESPACE, '1');
			tick();
		} catch(e) {
			expect(e.message).toBe(UNSUB_ERROR_MSG);
		}
	});

	it('throws error if no reference is specified', function() {
		
		bugle.sub(TEST_NAMESPACE);

		try {
			bugle.unsub(TEST_NAMESPACE);
			tick();
		} catch(e) {
			expect(e.message).toBe(UNSUB_ERROR_MSG);
		}
	});

	it("is completely asynchronous", function() {

		var asyncTest = {
			'handler': function() { }
		},

		reference = bugle.sub(TEST_NAMESPACE, asyncTest),
		subscribers = bugle.topics[TEST_NAMESPACE];
		
		bugle.unsub(TEST_NAMESPACE, reference);
		
		expect(subscribers.length).toBe(1);
		expect(subscribers[0].reference).toEqual(reference.reference);
		
		tick();

		expect(subscribers.length).toBe(0);
		expect(subscribers[0]).toBeUndefined();
	});

	it("can unsubscribe an member from a topic with a valid reference", function() {

		var reference = bugle.sub(TEST_NAMESPACE),
		status = bugle.unsub(TEST_NAMESPACE, reference);

		// reference should not be unsubscribed yet (event is asynchronous)
		expect(bugle.topics[TEST_NAMESPACE][0].reference).toBe(reference.reference);
		expect(bugle.topics[TEST_NAMESPACE].length).toBe(1);

		tick();

		// expect reference to now be unsubscribed
		expect(bugle.topics[TEST_NAMESPACE][0]).not.toBeDefined();
		expect(bugle.topics[TEST_NAMESPACE].length).toBe(0);
	});

	it('will not throw an error if topic cannot be found', function() {
		var ref = bugle.sub('topic'),
		res = bugle.unsub('emptyTopic', ref);

		tick();
		expect(res).toBe(undefined);
	});
});