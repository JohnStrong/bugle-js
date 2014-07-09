// alais given to the feature which allows users to map,filter,flatMap,etc. over pub messages
describe('pipe', function() {

	'use strict';
	
	var bugle, state,

	TEST_NAMESPACE = 'pipe',
	ASYNC_WAIT = 10,

	PUBLISH_ARRAY_MSG1 = [1,2,3],
	PUBLISH_ARRAY_MSG2 = [3,2,1],

	PUBLISH_OBJECT_MSG1 = {
		'name': 'John Doe',
		'age': 18
	},

	PUBLISH_OBJECT_MSG2 = {
		'name': 'Jane Doe',
		'age': 21
	},

	genSubscriber = function(scope) {
		return bugle.sub(TEST_NAMESPACE, scope? scope: undefined);
	},

	persistScope = function(subscriber) {
		var scopes = [];

		subscriber.map(function(msg) { 
			scopes.push(this); return msg;
		}).filter(function(msg) {
			scopes.push(this); return msg;
		}).reject(function(msg) {
			scopes.push(this); return false;
		}).flatMap(function(msg) {
			scopes.push(this); return [msg, msg];
		}).receive(function() {
			scopes.push(this);
		});

		return scopes;
	}

	beforeEach(function() {
		
		bugle = Bugle.extend({
			'_constructor': function() {}
		})();

		state = [];
	});

	beforeEach(function() {
		jasmine.clock().install();
	});

	afterEach(function() {
		state = null;
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('contains all hof required to compose over an incoming publish message', function() {

		var subscriber = genSubscriber();

		expect(subscriber.map).toBeDefined();
		expect(subscriber.filter).toBeDefined();
		expect(subscriber.reject).toBeDefined();
		expect(subscriber.flatMap).toBeDefined();
		expect(subscriber.squash).toBeDefined();
		expect(subscriber.receive).toBeDefined();
	});

	it('can map over incoming publish messages', function() {

		var subscriber = genSubscriber();

		subscriber.map(function(message) {
			return message.concat([4,5,6]);
		}).receive(function(message1, message2) {
			state.push(message1);
			state.push(message2);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([1,2,3,4,5,6]);

		expect(state[1]).toBeDefined();
		expect(state[1]).toEqual([3,2,1,4,5,6]);
	});

	it('can filter incoming publish messages', function() {

		var subscriber = genSubscriber();

		subscriber.filter(function(message) {
			return message[0] !== 1;
		}).receive(function(message1, message2) {
			state.push(message1);
			state.push(message2);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([3,2,1]);

		expect(state[1]).not.toBeDefined();
	});

	it('can reject incoming publish messages', function() {

		var subscriber = genSubscriber();

		subscriber.reject(function(message) {
			return message[0] === 1;
		}).receive(function(message1, message2) {
			state.push(message1);
			state.push(message2);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([3,2,1]);

		expect(state[1]).not.toBeDefined();
	});

	it('can flatMap over incoming publish messages', function() {

		var subscriber = genSubscriber();

		subscriber.flatMap(function(message) {
			return [message, [5,4,3]];
		}).receive(function(message1, message2) {
			state.push(message1);
			state.push(message2);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([1,2,3,5,4,3]);

		expect(state[1]).toBeDefined();
		expect(state[1]).toEqual([3,2,1,5,4,3]);
	});

	it('can squash incoming messages into one message', function() {

		var subscriber = genSubscriber();

		subscriber.squash()
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual([1,2,3,3,2,1]);

	});

	it('can chain hofs over published messages', function() {
		
		var subscriber = genSubscriber();

		subscriber.map(function(msg) { return msg; })
		.filter(function(msg) { return msg[0] !== 1; })
		.reject(function(msg) { return msg[0] === 1; })
		.flatMap(function(msg) { return [msg, msg]; })
		.squash().receive(function(msg1, msg2) {
			state.push(msg1);
			state.push(msg2);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([3,2,1,3,2,1]);

		expect(state[1]).not.toBeDefined();
	});

	it('can carry subscriber scope over its hof chain', function() {

		var subscriber = genSubscriber(),
		them = persistScope(subscriber);

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1);

		tick(ASYNC_WAIT);

		expect(them.length > 1).toBe(true);

		them.forEach(function(that) {
			expect(that.oId).toBeDefined();
			expect(util.type(that.oId)).toBe('Number');

			expect(that.topics).toBeDefined();
			expect(util.type(that.topics)).toBe('Array');
		});
	});

	it('can carry custom scope over hof chain', function() {
		
		var subscriber = genSubscriber({
			'state': [1,2,3,4],
			'misc': function() { }
		}),

		them = persistScope(subscriber);

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1);

		tick(ASYNC_WAIT);

		expect(them.length > 1).toBe(true);

		them.forEach(function(that) {
			expect(that.state).toBeDefined();
			expect(util.type(that.state)).toBe('Array');

			expect(that.misc).toBeDefined();
			expect(util.type(that.misc)).toBe('Function');
		});
	});

	it('cannot chain more hofs after receive function', function() {
		var subscriber = genSubscriber();

		var maybeChain = subscriber.receive(function() {
			//
		});

		expect(maybeChain).not.toBeDefined();
	});

	it('can run object messages over chained functions', function() {
		var subscriber = genSubscriber(),

		johnDesc, janeDesc;

		subscriber.map(function(msg1) {
			return ''.concat(msg1.name, ': ', msg1.age, '.');
		}).receive(function(msg1, msg2) {
			johnDesc = msg1;
			janeDesc = msg2;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);


		expect(johnDesc).toBeDefined();
		expect(johnDesc).toBe('John Doe: 18.');

		expect(janeDesc).toBeDefined();
		expect(janeDesc).toBe('Jane Doe: 21.');
	});
});