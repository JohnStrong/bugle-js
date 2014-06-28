
describe('publish', function() {

	var bugle;

	beforeEach(function() {
		
		bugle = Bugle.extend({
			'_constructor': function() {}
		})();

		jasmine.clock().install();
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it('can publish on empty topic', function() {
		expect(bugle.pub('noTopic', [])).toBe(true);
	});
});