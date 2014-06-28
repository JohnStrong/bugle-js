
describe('subscribe suite', function() {

	var bugle,

	type = function(val) {
		return Object.prototype.toString.call(val).slice(8, -1);
	},

	build = function(n, fn) {
		var arr = [];

		while(n) {
			arr.push(fn);
			n--;
		}

		return arr;
	},

	subAll = function(bugle, topic, arr) {

		while(arr.length) {
			bugle.sub(topic, arr.shift());
		}
	},

	topic = function(bugle, topic) {
		
		topic = bugle.topics[topic];

		return {
			
			'len': function() {
				return topic.length;
			},

			'take': function(n) {
				return topic.splice(0, Math.min(this.len(), n));
			}
		};
	};

	beforeEach(function() {
		
		bugle = Bugle.extend({
			
			'_constructor': function(a, b) {
				this.a = a;
				this.b = b;
			},

			'listen': function() {
				this.sub('values', this.update)
			},

			'update': function(a, b) {
				this.a = a;
				this.b = b;
			}
		})(1,2);
	});

	it("should start with an empty state", function() {

		expect(bugle.oId).toBe(0);
		expect(bugle.topics).toEqual([]);
	});

	it("can subscribe an anonymous function to a topic", function() {

		bugle.sub('values', function() { });

		var values = topic(bugle, 'values'),
		topicLen = values.len(),
		sample = values.take(1)[0];

		expect(topicLen).toBe(1);

		expect(sample.fn).toBeDefined();
		expect(type(sample.fn)).toBe('Function');
	});

	it("can subscribe an object method to a topic", function() {

		// subscribe bugle to 'values' topic
		bugle.listen();

		var values = topic(bugle, 'values'),
		topicLen = values.len(),
		sample = values.take(1)[0];

		expect(topicLen).toBe(1);

		expect(sample.fn).toBeDefined();
		expect(type(sample.fn)).toBe('Function');

	});

	it('can have multiple subscriptions to a topic', function() {
		
		var SAMPLE_LENGTH = 100,
		SUBSET_LENGTH = 50,

		functionsArr = build(SAMPLE_LENGTH, function() { });

		subAll(bugle, 'multiples', functionsArr);

		var multiples = topic(bugle, 'multiples'),
		len = multiples.len(),
		sample = multiples.take(SUBSET_LENGTH);

		expect(len).toBe(SAMPLE_LENGTH);

		for(var ith = 0; ith < SUBSET_LENGTH; ith++) {

			expect(sample[ith].fn).toBeDefined();
			expect(type(sample[ith].fn)).toBe('Function');
		}
	});

});