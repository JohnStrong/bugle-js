window.util = (function() {
	
	var type = function(val) {
		return Object.prototype.toString.call(val).slice(8, -1);
	},

	build = function(n, operation) {
		
		function _build(curr, arr) {
			
			if(curr === 0) return arr;

			return _build(--n, arr.concat(operation))
		}

		return _build(n, []);
	},

	topic = function(instance) {

		return function(namespace) {
		
			var topic = instance.topics[namespace];

			return {
				
				'len': function() {
					return topic.length;
				},

				'take': function(n) {
					return topic.splice(0, Math.min(this.len(), n));
				}
			};
		}
	};

	tick = function(wait) {
		jasmine.clock().tick(wait);
	},

	sum = function(arr) {
		return arr.reduce(function(prev, curr) {
			return prev + curr;
		});
	};

	return {
		'type': type,
		'build': build,
		'topic': topic,
		'tick': tick,
		'sum': sum
	};
})();