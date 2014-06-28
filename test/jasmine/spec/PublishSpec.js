
describe('publish', function() {

	// consts
	var TEST_NAMESPACE = 'pubTest',
	SOME_NAMESPACE = '~pubTest',

	// test state
	bugle, pubTest, testArr = [1,2,3];
		

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
				this.state = data; 
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
		var subs = build(100, pubTest).map(function(obj) {
			bugle.sub(TEST_NAMESPACE, obj.handler, obj);
		});

		expect(bugle.topics[TEST_NAMESPACE].length).toBe(100);

		// publish to the topic namespace
		bugle.pub(TEST_NAMESPACE, testArr);

		jasmine.clock().tick(10);

		// last arg to sub is ALWAYS the topic name...
		expect(pubTest.handler).toHaveBeenCalledWith(testArr, TEST_NAMESPACE);
		expect(pubTest.state).toEqual(testArr);
	});

	it('ONLY forwards data to subscribers on the specified topic', function() {

		var testInstances = build(100, pubTest),
		used = testInstances.splice(0, 50),

		// to be ignored test object
		ignoreTest = {
			'handler': function() {} 
		};

		spyOn(pubTest, 'handler');
		spyOn(ignoreTest, 'handler');
		
		these = used.map(function(obj) {
			bugle.sub(TEST_NAMESPACE, obj.handler, obj);
		}),

		those = testInstances.map(function(obj) {
			bugle.sub(SOME_NAMESPACE, ignoreTest.handler, ignoreTest);
		});

		// publish to 'pubTest'
		bugle.pub(TEST_NAMESPACE, testArr);

		jasmine.clock().tick(10);

		expect(pubTest.handler).toHaveBeenCalled();
		expect(ignoreTest.handler).not.toHaveBeenCalled();
	});

});