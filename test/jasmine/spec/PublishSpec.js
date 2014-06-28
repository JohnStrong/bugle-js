
describe('publish', function() {

	'use strict';

	// consts
	var TEST_NAMESPACE = 'pubTest',
	SOME_NAMESPACE = '~pubTest',

	// test state
	bugle, pubTest,
		

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
		
		bugle = Bugle.extend({
			'_constructor': function() {}
		})();

		jasmine.clock().install();
	});

	beforeEach(function() {

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

	it('will not throw if topic is empty', function() {
		expect(bugle.pub(TEST_NAMESPACE, [])).toBe(true);
	});

	it('forwards data to each subscriber on a topic', function() {

		// listen for calls to handler in the test object
		// use actual implementation
		spyOn(pubTest, 'handler').and.callThrough();

		// build 100 pubTest, subscribe each
		var testNum = 1;

		build(100, pubTest).forEach(function(obj) {
			bugle.sub(TEST_NAMESPACE, obj.handler, obj);
		});

		expect(bugle.topics[TEST_NAMESPACE].length).toBe(100);

		// publish to the topic namespace
		bugle.pub(TEST_NAMESPACE, testNum);

		jasmine.clock().tick(10);

		// last arg to sub is ALWAYS the topic name...
		expect(pubTest.handler).toHaveBeenCalledWith(testNum, TEST_NAMESPACE);
		expect(sum(pubTest.state)).toEqual(100);
	});

	it('ONLY forwards data to subscribers on the specified topic', function() {

		var testArr = [1,2,3],

		testInstances = build(100, pubTest),
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

		jasmine.clock().tick(10);

		expect(pubTest.handler).toHaveBeenCalled();
		expect(ignoreTest.handler).not.toHaveBeenCalled();
	});

});