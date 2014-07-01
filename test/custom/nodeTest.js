var bugle = require('./../../lib/bugle.js');
var sys = require('sys');

var state = [];

var custInstance = bugle.extend({ 
	'_constructor': function() { }
})();

var oId1 = custInstance.sub('node', function(data) {
	state = state.concat(data);

	sys.puts(state.length === 4);

});

var oId2 = custInstance.sub('node', function(data) {
	state = state.concat(data);

	sys.puts(state.length === 8);
});

custInstance.pub('node', [1,2,3,4]);

custInstance.unsub('node', oId1);
custInstance.unsub('node', oId2);