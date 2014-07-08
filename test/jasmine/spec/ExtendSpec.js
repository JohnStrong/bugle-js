
describe('extend', function() {

	'use strict';

	var TOPIC_NAMESPACE = 'extendTest',
	ASYNC_WAIT = 100;

	beforeEach(function() {
		jasmine.clock().install();
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('should encapsulate parent instances state', function() {
		var parent = Bugle.extend({
			'_constructor': function(data) {
				this.data = data;
			}
		})([1,2,3]),

		child = parent.extend({
			'_constructor': function() {}
		})();

		expect(child.data).toBeDefined();
		expect(child.data).toEqual(parent.data);
	});

	it('can publish messages to parent instance', function() {

		var globalState = [],

		parent = Bugle.extend({
			'_constructor': function() {
				this.sub(TOPIC_NAMESPACE)
				.receive(function(data) {
					globalState = data;
				});
			}
		})(),

		child = parent.extend({
			'_constructor': function(data) {
				this.pub(TOPIC_NAMESPACE, data);
			}
		})([1,2,3]);

		util.tick(ASYNC_WAIT);

		expect(parent).toBeDefined();
		expect(child).toBeDefined();
		expect(globalState).toEqual([1,2,3]);
	});

	it('can subscribe objects on parent instance', function() {

		var parent = Bugle.extend({
			'_constructor': function() {}
		})();

		expect(parent.topics[TOPIC_NAMESPACE]).toBeUndefined();

		var child = parent.extend({
			'_constructor': function() {
				this.sub(TOPIC_NAMESPACE);
			}
		})();

		expect(parent.topics[TOPIC_NAMESPACE].length).toBe(1);

	});

	it('publishes messages all the way up the prototype chain', function() {

		var globalState = [],

		constructor = function() {
			this.sub(TOPIC_NAMESPACE)
			.receive(function(data) {
				globalState = globalState.concat(data);
			});
		},

		ancestor = util.extend(Bugle, constructor)(),
		parent = util.extend(ancestor, constructor)(),
		child = util.extend(parent, constructor)();

		child.pub(TOPIC_NAMESPACE, [1,2]);

		util.tick(ASYNC_WAIT);

		expect(globalState.length).toBe(6);
		expect(globalState).toEqual([1,2,1,2,1,2]);
	});

	it('can publish messages to its children', function() {
		
		var MSG = 'update',

		globalState = null,

		parent = Bugle.extend({
			'_constructor': function() { },

			'toChildren': function() {
				this.pub(TOPIC_NAMESPACE, MSG);
			}
		})(),

		child = util.extend(parent, function() {
			this.sub(TOPIC_NAMESPACE)
			.receive(function(msg) {
				globalState = msg;
			});
		})();

		expect(globalState).toBe(null);

		// topic should be in scope of parent and child
		expect(parent.topics[TOPIC_NAMESPACE].length).toBe(1);
		expect(child.topics[TOPIC_NAMESPACE].length).toBe(1);

		// publish to topic
		parent.toChildren();

		util.tick(ASYNC_WAIT);

		// child should receive published msg
		expect(globalState).toBe(MSG);
	});
});