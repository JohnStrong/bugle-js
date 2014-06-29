
describe('unsubscribe', function() {
	
	'use stirct';

	var TEST_NAMESPACE = 'unsubTest',

	UNSUB_ERROR_MSG = 'USAGE [topic:String, oId:Number]',

	bugle;

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

	it("can unsubscribe an member from a topic with a valid oId", function() {

		var oId = bugle.sub(TEST_NAMESPACE, function() {}),
		status = bugle.unsub(TEST_NAMESPACE, oId);

		expect(status).toBe(true);
		
		// oId should not be unsubscribed yet (event is asynchronous)
		expect(bugle.topics[TEST_NAMESPACE].length).not.toBe(0);

		jasmine.clock().tick(10);

		// expect oId to now be unsubscribed
		expect(bugle.topics[TEST_NAMESPACE].length).toBe(0);
	});

	it('returns false in unsubscribe if specified topic is not found', function() {
		expect(bugle.unsub('emptyTopic', 1)).toBe(false);
	});

	it('throws error in unsubscribe if no oId is specified', function() {
		
		bugle.sub(TEST_NAMESPACE, function() { });

		try {
			bugle.unsub(TEST_NAMESPACE)
		} catch(e) {
			expect(e).toBe(UNSUB_ERROR_MSG);
		}
	});
});