/**
* Extremely simple renderer to just dump the raw data output to the console
*/

module.exports = function(next, data, program) {
	console.log(JSON.stringify(data, null, '\t'))
	next();
};
