
describe('extend', function() {

	'use strict';

	var _extend = function(obj, constructor) {
		var child = obj.extend({
			'_constructor': constructor
		});

		return child;
	};

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
		expect(child.data).toEqual([1,2,3]);
	});

	it('can publish messages to parent instance', function() {

		var globalState = [],

		parent = Bugle.extend({
			'_constructor': function() {
				this.sub('pubTest', function(data) {
					globalState = data;
				});
			}
		})(),

		child = parent.extend({
			'_constructor': function(data) {
				this.pub('pubTest', data);
			}
		})([1,2,3]);

		jasmine.clock().tick(10);

		expect(globalState).toEqual([1,2,3]);
	});

	it('can subscribe objects on parent instance', function() {

		var TOPIC_NAMESPACE = 'subTest',

		parent = Bugle.extend({
			'_constructor': function() {}
		})();

		expect(parent.topics[TOPIC_NAMESPACE]).toBeUndefined();

		var child = parent.extend({
			'_constructor': function() {
				this.sub(TOPIC_NAMESPACE, function(data) {
					//
				});
			}
		})();

		expect(parent.topics[TOPIC_NAMESPACE].length).toBe(1);

	});

	it('publishes messages all the way up the prototype chain', function() {

		var TOPIC_NAMESPACE = 'chainTest',

		globalState = [],

		constructor = function() {
			this.sub(TOPIC_NAMESPACE, function(data) {
				globalState = globalState.concat(data);
			})
		},

		ancestor =_extend(Bugle, constructor)(),
		parent =_extend(ancestor, constructor)(),
		child =_extend(parent, constructor)();

		child.pub(TOPIC_NAMESPACE, [1,2]);

		jasmine.clock().tick(10);

		expect(globalState.length).toBe(6);
		expect(globalState).toEqual([1,2,1,2,1,2]);
	});

	it('can publish messages to its children', function() {
		
		var TOPIC_NAMESPACE = 'below',
		MSG = 'update',

		globalState = null,

		parentBlueprint = Bugle.extend({
			'_constructor': function() { },

			'toChildren': function() {
				this.pub(TOPIC_NAMESPACE, MSG);
			}
		});

		var parent = parentBlueprint(),

		child =_extend(parent, function() {
			this.sub(TOPIC_NAMESPACE, function(msg) {
				globalState = msg;
			});
		})();

		expect(globalState).toBe(null);

		// topic should be in scope of parent and child
		expect(parent.topics[TOPIC_NAMESPACE].length).toBe(1);
		expect(child.topics[TOPIC_NAMESPACE].length).toBe(1);

		// publish to topic
		parent.toChildren();

		jasmine.clock().tick(10);

		// child should receive published msg
		expect(globalState).toBe(MSG);
	});
});