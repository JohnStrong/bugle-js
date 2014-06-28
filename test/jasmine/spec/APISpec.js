
describe('api', function() {

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
