// large refractoring needs to be done
describe('subscriber', function() {

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
		}).reduce(function(msg) {
			scopes.push(this); return [msg];
		}).reduceRight(function(msg) {
			scopes.push(this); return [msg];
		}).squash().receive(function() {
			scopes.push(this);
		});

		return scopes;
	};

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
		expect(subscriber.reduce).toBeDefined();
		expect(subscriber.reduceRight).toBeDefined();
		expect(subscriber.squash).toBeDefined();
		expect(subscriber.receive).toBeDefined();
	});

	it('can map over array messages', function() {

		var subscriber = genSubscriber();

		subscriber.map(function(message) {
			return message.concat([4,5,6]);
		}).receive(function(messages) {
			state.push(messages[0]);
			state.push(messages[1]);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([1,2,3,4,5,6]);

		expect(state[1]).toBeDefined();
		expect(state[1]).toEqual([3,2,1,4,5,6]);
	});

	it('can map over object messages', function() {

		var subscriber = genSubscriber();

		subscriber.map(function(message) {
			return message.name.toUpperCase();
		}).receive(function(messages) {
			state.push(messages[0]);
			state.push(messages[1]);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual('JOHN DOE');

		expect(state[1]).toBeDefined();
		expect(state[1]).toEqual('JANE DOE');
	});

	it('can filter on array messages', function() {

		var subscriber = genSubscriber();

		subscriber.filter(function(message) {
			return message[0] !== 1 && message[2] !== 3;
		}).receive(function(messages) {
			state.push(messages[0]);
			state.push(messages[1]);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([3,2,1]);

		expect(state[1]).not.toBeDefined();
	});

	it('can filter on object messages', function() {

		var subscriber = genSubscriber();

		subscriber.filter(function(message) {
			return message.name === 'John Doe';
		}).receive(function(messages) {
			state.push(messages[0]);
			state.push(messages[1]);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0].name).toEqual('John Doe');

		expect(state[1]).not.toBeDefined();
	});

	it('can reject messages', function() {

		var subscriber = genSubscriber();

		subscriber.reject(function(message) {
			return message[0] === 1;
		}).receive(function(messages) {
			state.push(messages[0]);
			state.push(messages[1]);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual([3,2,1]);

		expect(state[1]).not.toBeDefined();
	});

	it('can flatMap over array messages', function() {

		var subscriber = genSubscriber(),
		expectedOutput = [1,2,3,5,4,3,3,2,1,5,4,3];

		subscriber.flatMap(function(message) {
			return [message, [5,4,3]];
		}).receive(function(flattenMessages) {
			state.push(flattenMessages);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual(expectedOutput);
	});

	it('can flatMap over object messages', function() {

		var subscriber = genSubscriber(),
		expectedOutput = [
			'name', 'age', PUBLISH_OBJECT_MSG1,
			'name', 'age', PUBLISH_OBJECT_MSG2
		];

		subscriber.flatMap(function(message) {
			return [Object.keys(message), [message]];
		}).receive(function(flattenedMessage) {
			state.push(flattenedMessage);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual(expectedOutput);
	});

	it('can reduce over array messages with accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = [5,1,2,3,5,3,2,1];

		subscriber.reduce(function(message, iter) {
			return iter.concat(partialArray.concat(message));
		}, /* acc value */ [])
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

	});

	it('can reduce over array messages WITHOUT accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = [1,2,3,5,3,2,1];

		subscriber.reduce(function(message, iter) {
			return iter.concat(partialArray.concat(message));
		})
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

	});

	it('can reduce over empty array', function() {

		var subscriberAcc = genSubscriber(),
		subscriberNoAcc = genSubscriber(),

		emptyArr = [],
		maybeResult = [];

		subscriberAcc.reduce(function(message, iter) {
			return iter.concat(message);
		}, [])
		.receive(function(message) {
			state[0] = message;
		});

		subscriberNoAcc.reduce(function(message, iter) {
			return iter.concat(message);
		})
		.receive(function(message) {
			state[1] = message;
		});


		bugle.pub(TEST_NAMESPACE, emptyArr);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual(maybeResult);

		expect(state[1]).toBeDefined();
		expect(state[1]).toEqual(maybeResult);

	});

	it('can reduce over object messages with accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = ['John Doe', 18, 'Jane Doe', 21];

		subscriber.reduce(function(message, iter) {
			return iter.concat([message.name, message.age]);
		}, /* acc value */ [])
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

	});

	it('can reduce over object messages WITHOUT accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = -3;

		subscriber.reduce(function(message, iter) {
			return iter.age - message.age;
		})
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

	});

	it('can reduceRight over array messages with accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = [5,3,2,1,5,1,2,3];

		subscriber.reduceRight(function(message, iter) {
			return iter.concat(partialArray.concat(message));
		}, /* acc value */ [])
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

	});

	it('can reduceRight over array messages WITHOUT accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = [3,2,1,5,1,2,3]

		subscriber.reduceRight(function(message, iter) {
			return iter.concat(partialArray.concat(message));
		})
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

	});

	it('can reduceRight over object messages with accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = 61;

		subscriber.reduce(function(message, iter) {
			return iter - message.age;
		}, /* acc value */ 100)
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

	});

	it('can reduceRight over object messages with accumulator value', function() {

		var subscriber = genSubscriber(),

		partialArray = [5],
		maybeResult = 3;

		subscriber.reduceRight(function(message, iter) {
			return iter.age - message.age;
		})
		.receive(function(message) {
			state = message;
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG2);

		tick(ASYNC_WAIT);

		expect(state).toBeDefined();
		expect(state).toEqual(maybeResult);

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
		
		var subscriber = genSubscriber(),

		maybeResult = [3,2,1,3,2,1];

		subscriber.map(function(msg) { return msg; })
		.filter(function(msg) { return msg[0] !== 1; })
		.reject(function(msg) { return msg[0] === 1; })
		.flatMap(function(msg) { return [msg, msg]; })
		.squash().receive(function(msg) {
			state.push(msg);
		});

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2);

		tick(ASYNC_WAIT);

		expect(state[0]).toBeDefined();
		expect(state[0]).toEqual(maybeResult);
	});

	it('can carry subscriber scope over its hof chain', function() {

		var subscriber = genSubscriber(),
		them = persistScope(subscriber);

		bugle.pub(TEST_NAMESPACE, PUBLISH_ARRAY_MSG1);

		tick(ASYNC_WAIT);

		// -1 because we cant persist scope in squash method
		expect(them).toBeTruthy();

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

		expect(them).toBeTruthy();

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

	it('returns empty array in receive when no message survives transformation', function() {

		var subscriber1 = genSubscriber(),
		subscriber2 = genSubscriber();

		subscriber1.filter(function(message) {
			return !message;
		}).receive(function(maybeMessages) {
			state.push(maybeMessages);
		});

		subscriber1.reject(function(message) {
			return message;
		}).receive(function(maybeMessages) {
			state.push(maybeMessages);
		});


		bugle.pub(TEST_NAMESPACE, 
			PUBLISH_OBJECT_MSG1, PUBLISH_OBJECT_MSG1, 
			PUBLISH_ARRAY_MSG1, PUBLISH_ARRAY_MSG2
		);

		tick(ASYNC_WAIT);

		expect(state[0].length).toBe(0);
		expect(state[1].length).toBe(0);
	});

});