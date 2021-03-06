
describe('publish', function() {

	'use strict';

	// consts
	var TEST_NAMESPACE = 'pubTest',
	SOME_NAMESPACE = '~pubTest',

	ASYNC_WAIT = 10,
	BUILD_QTY = 100,

	PUB_ERROR_MSG = 'UASGE [ topic:String[, message1:Any[, message2:Any[, ..]]] ]',

	// test state
	bugle, pubTest;

	beforeEach(function() {
		jasmine.clock().install();
	});

	beforeEach(function() {

		bugle = Bugle.extend({
			'_constructor': function() {}
		})();
		
		pubTest = {
			
			state: [],

			handler: function(msgs) { 
				this.state = this.state.concat(msgs[0]); 
			}
		};
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('will not throw if a topic is empty', function() {
		var res = bugle.pub(TEST_NAMESPACE, []);
		tick(ASYNC_WAIT);

		// hack to verify that no error has been throw by bugle call
		expect(res).toBe(undefined);
	});

	it('throws error if topic param is NOT type String', function() {
		try {
			bugle.pub(null, [])
		} catch(e) {
			expect(e.message).toBe(PUB_ERROR_MSG);
		} 
	});

	it('is completely asynchronous', function() {
		
		var syncStr = 'sync', asyncStr = 'async';

		spyOn(pubTest, 'handler').and.callFake(function(str) {
			syncStr = str[0];
		});

		var ref = bugle.sub(TEST_NAMESPACE, pubTest);
		bugle.pub(TEST_NAMESPACE, asyncStr);

		ref.receive(pubTest.handler);
		
		expect(pubTest.handler).not.toHaveBeenCalled();
		expect(syncStr).not.toEqual(asyncStr);
		
		// make test wait
		tick(ASYNC_WAIT);

		expect(pubTest.handler).toHaveBeenCalled();
		expect(syncStr).toEqual(asyncStr);
		
	});

	it('forwards data to each subscriber on a topic', function() {

		// listen for calls to handler in the test object
		// use actual implementation
		spyOn(pubTest, 'handler').and.callThrough();

		// build 100 pubTest, subscribe each
		var test = [1],

		refs = util.build(BUILD_QTY, pubTest).map(function(obj) {
			return bugle.sub(TEST_NAMESPACE, obj);
		});

		expect(bugle.topics[TEST_NAMESPACE].length).toBe(BUILD_QTY);

		refs.forEach(function(ref) {
			ref.receive(pubTest.handler);
		});

		// publish to the topic namespace
		bugle.pub(TEST_NAMESPACE, 1);

		tick(ASYNC_WAIT);

		expect(pubTest.handler).toHaveBeenCalledWith(test);
		expect(util.sum(pubTest.state)).toEqual(BUILD_QTY);
	});

	it('ONLY forwards data to subscribers on the specified topic', function() {

		var testArr = [1,2,3],

		testInstances = util.build(BUILD_QTY, pubTest),
		used = testInstances.splice(0, 50),

		// to be ignored test object
		ignoreTest = {
			'handler': function() {} 
		};

		spyOn(pubTest, 'handler');
		spyOn(ignoreTest, 'handler');
		
	 	var usedRefs = used.map(function(obj) {
			return bugle.sub(TEST_NAMESPACE, obj);
		}),

		unusedRefs = testInstances.map(function(obj) {
			return bugle.sub(SOME_NAMESPACE, obj);
		});

		usedRefs.forEach(function(ref) {
			ref.receive(pubTest.handler);
		});

		unusedRefs.forEach(function(ref) {
			ref.receive(pubTest.handler);
		});

		// publish to 'pubTest'
		bugle.pub(TEST_NAMESPACE, testArr);
		
		tick(ASYNC_WAIT);

		expect(pubTest.handler).toHaveBeenCalled();
		expect(ignoreTest.handler).not.toHaveBeenCalled();
	});

	it('will call subscriber receive with undefined if no data sent on publish', function() {

		var state,
		
		ref = bugle.sub(TEST_NAMESPACE);

		ref.receive(function(maybeData) {
			state = maybeData;
		});

		bugle.pub(TEST_NAMESPACE);
		
		tick(ASYNC_WAIT);

		expect(state[0]).not.toBeDefined();
	});

});