
describe('unsubscribe', function() {
	
	'use strict';

	var TEST_NAMESPACE = 'unsubTest',

	UNSUB_ERROR_MSG = 'USAGE [topic:String, oId:Number]',

	ASYNC_WAIT = 10,

	bugle,

	tick = function() {
		jasmine.clock().tick(ASYNC_WAIT);
	}

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

	it('throws error if topic param is NOT type String', function() {

		var oId = bugle.sub(TEST_NAMESPACE, function() {});

		try {
			bugle.unsub(null, oId);
		} catch(e) {
			expect(e).toBe(UNSUB_ERROR_MSG);
		}
	});

	it('throws error if no oId is specified', function() {
		
		bugle.sub(TEST_NAMESPACE, function() {});

		try {
			bugle.unsub(TEST_NAMESPACE)
		} catch(e) {
			expect(e).toBe(UNSUB_ERROR_MSG);
		}
	});

	it("is completely asynchronous", function() {

		var asyncTest = {
			'handler': function() { }
		},

		oId = bugle.sub(TEST_NAMESPACE, asyncTest.handler, asyncTest),
		subscribers = bugle.topics[TEST_NAMESPACE];
		
		bugle.unsub(TEST_NAMESPACE, oId);
		
		expect(subscribers.length).toBe(1);
		expect(subscribers[0].oId).toEqual(oId);
		
		tick();

		expect(subscribers.length).toBe(0);
		expect(subscribers[0]).toBeUndefined();
	});

	it("can unsubscribe an member from a topic with a valid oId", function() {

		var oId = bugle.sub(TEST_NAMESPACE, function() {}),
		status = bugle.unsub(TEST_NAMESPACE, oId);

		expect(status).toBe(true);
		
		// oId should not be unsubscribed yet (event is asynchronous)
		expect(bugle.topics[TEST_NAMESPACE][0].oId).toBe(oId);
		expect(bugle.topics[TEST_NAMESPACE].length).not.toBe(0);

		tick();

		// expect oId to now be unsubscribed
		expect(bugle.topics[TEST_NAMESPACE][0]).not.toBeDefined();
		expect(bugle.topics[TEST_NAMESPACE].length).toBe(0);
	});

	it('returns false in unsubscribe if specified topic is not found', function() {
		expect(bugle.unsub('emptyTopic', 1)).toBe(false);
	});
});