/**
* Extremely simple renderer to just dump titles of each item to the console
*/

module.exports = function(next, data, program) {
	data.forEach(i => console.log(i.title));
	next();
};
