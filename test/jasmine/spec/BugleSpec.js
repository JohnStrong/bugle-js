

describe('api suite', function() {

	var bugle,

	methods = {
		'_constructor': function() { }
	};

	beforeEach(function() {
		bugle = Bugle.extend;
	});


	it("should contain extend member", function() {
		expect(bugle).toBeDefined();
	});

	it("should expect an object", function() {
		
		expect(bugle()).not.toBeDefined();
		expect(bugle({})).not.toBeDefined();

		expect(bugle(methods)).toBeDefined();
	});

	it("should return an object that inherits Bugle methods", function() {
		
		var customBugle = bugle(methods)();

		expect(customBugle.pub).toBeDefined();
		expect(customBugle.sub).toBeDefined();
		expect(customBugle.unsub).toBeDefined();
	});

});

describe('subscribe suite', function() {

	var bugle;

	beforeEach(function() {
		
		bugle = Bugle.extend({
			
			'_constructor': function(a, b) {
				this.a = a;
				this.b = b;
			},

			'getValues': function() {
				this.pub('values', a, b);
			}
		});
	});

	it("should start with an empty state", function() {

		var customBugle = bugle(1,2);

		expect(customBugle.oId).toBe(0);
		expect(customBugle.topics).toEqual([]);
	});

	it("can subscribe an anonymous function to a topic", function() {

		var customBugle = bugle(1,2);
		customBugle.sub('values', function() { });

		var topicLen = customBugle.topics['values'].length,
		fn = customBugle.topics['values'][0];

		expect(topicLen).toBe(1);
		expect(typeof fn).toBe('object');
	});

});
