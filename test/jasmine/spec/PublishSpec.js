
describe('publish', function() {

	'use strict';

	// consts
	var TEST_NAMESPACE = 'pubTest',
	SOME_NAMESPACE = '~pubTest',

	ASYNC_WAIT = 10,

	BUILD_QTY = 100,

	PUB_ERROR_MSG = 'UASGE [ topic:String[, data1:Any[, data2:Any[, ..]]] ]',

	// test state
	bugle, pubTest,

	tick = function() {
		jasmine.clock().tick(ASYNC_WAIT);
	},	

	sum = function(arr) {
		return arr.reduce(function(prev, curr) {
			return prev + curr;
		});
	},

	// build n number of Any type
	// returns as Array
	build = function(n, topic) {
		var arr = [];

		while(n) {
			arr.push(topic);
			n--;
		}

		return arr;
	};

	beforeEach(function() {
		jasmine.clock().install();
	});

	beforeEach(function() {

		bugle = Bugle.extend({
			'_constructor': function() {}
		})();
		
		pubTest = {
			
			state: [],

			handler: function(data) { 
				this.state = this.state.concat(data); 
			}
		};
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	/*
	it('will not throw if a topic is empty', function() {
		bugle.pub(TEST_NAMESPACE, []);
		tick();
	});
	*/

	it('throws error if topic param is NOT type String', function() {
		try {
			bugle.pub(null, [])
		} catch(e) {
			expect(e).toBe(PUB_ERROR_MSG);
		} 
	});

	it('is completely asynchronous', function() {
		
		var syncStr = 'sync', asyncStr = 'async';

		spyOn(pubTest, 'handler').and.callFake(function(str) {
			syncStr = str;
		});

		bugle.sub(TEST_NAMESPACE, pubTest.handler, pubTest);
		bugle.pub(TEST_NAMESPACE, asyncStr);
		
		expect(pubTest.handler).not.toHaveBeenCalled();
		expect(syncStr).not.toEqual(asyncStr);
		
		// make test wait
		tick();

		expect(pubTest.handler).toHaveBeenCalled();
		expect(syncStr).toEqual(asyncStr);
		
	});

	it('forwards data to each subscriber on a topic', function() {

		// listen for calls to handler in the test object
		// use actual implementation
		spyOn(pubTest, 'handler').and.callThrough();

		// build 100 pubTest, subscribe each
		var testNum = 1;

		build(BUILD_QTY, pubTest).forEach(function(obj) {
			bugle.sub(TEST_NAMESPACE, obj.handler, obj);
		});

		expect(bugle.topics[TEST_NAMESPACE].length).toBe(BUILD_QTY);

		// publish to the topic namespace
		bugle.pub(TEST_NAMESPACE, testNum);

		tick();

		// last arg to sub is ALWAYS the topic name...
		expect(pubTest.handler).toHaveBeenCalledWith(testNum, TEST_NAMESPACE);
		expect(sum(pubTest.state)).toEqual(BUILD_QTY);
	});

	it('ONLY forwards data to subscribers on the specified topic', function() {

		var testArr = [1,2,3],

		testInstances = build(BUILD_QTY, pubTest),
		used = testInstances.splice(0, 50),

		// to be ignored test object
		ignoreTest = {
			'handler': function() {} 
		};

		spyOn(pubTest, 'handler');
		spyOn(ignoreTest, 'handler');
		
	 	used.forEach(function(obj) {
			bugle.sub(TEST_NAMESPACE, obj.handler, obj);
		});

		testInstances.forEach(function(obj) {
			bugle.sub(SOME_NAMESPACE, obj.handler, obj);
		});

		// publish to 'pubTest'
		bugle.pub(TEST_NAMESPACE, testArr);
		
		tick();

		expect(pubTest.handler).toHaveBeenCalled();
		expect(ignoreTest.handler).not.toHaveBeenCalled();
	});

	it('will call subscriber with lone topic name if no data sent on publish', function() {

		var topicName,
		toCall = function(topic) { topicName = topic; };

		bugle.sub(TEST_NAMESPACE, toCall);
		bugle.pub(TEST_NAMESPACE);

		tick();

		expect(topicName).toBe(TEST_NAMESPACE);
	});

});