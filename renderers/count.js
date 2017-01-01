/**
* Renderer that just returns the count of the results found
*/

module.exports = function(next, data, program) {
	console.log(data.length);
	next();
};
