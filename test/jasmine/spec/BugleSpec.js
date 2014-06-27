

describe('Bugle suite', function() {

	var bugle,

	methods = {
		'_constructor': function(a, b) {
			this.a = a;
			this.b = b;
		}
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
		
		var customBugle = bugle(methods)(1,2);

		expect(customBugle.pub).toBeDefined();
		expect(customBugle.sub).toBeDefined();
		expect(customBugle.unsub).toBeDefined();
	});

	it("should start with an empty state", function() {

		var customBugle = bugle(methods)(1,2);

		expect(customBugle.oId).toBe(0);
		expect(customBugle.topics).toEqual([]);
	});

})