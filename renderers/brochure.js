/**
* Create brochure.html in the current working directory containing information on all items
*/
var _ = require('lodash');
var async = require('async-chainable');
var handlebars = require('handlebars');
var fs = require('fs');

module.exports = function(next, data, program) {
	async()
		// Read in the template file {{{
		.then('template', function(next) {
			fs.readFile(__dirname + '/brochure.html', 'utf-8', next);
		})
		// }}}
		// Install handlebars helpers {{{
		.then(function(next) {
			/**
			* Decode a URL encoded by Kodi and return it to plain text
			* @param {string} url The encoded URL to decode
			* @return {string} The decoded URL
			*/
			handlebars.registerHelper('decodeUrl', function(url) {
				return unescape(url).replace(/image:\/\//, '').replace(/\/$/, '');
			});

			/**
			* Return only the given number of array elements from the start of an array
			* @param {number} offset The number of items to take from the beginning of the array
			* @param {array} arr The array to operate on
			* @return {array} An array of 'offset' elements
			*/
			handlebars.registerHelper('head', function(offset, arr) {
				return _.take(arr, offset);
			});

			/**
			* Round a number to a given number of decimal places
			* @param {number} no The number to round
			* @param {number} dp The decimal places to round to
			* @return {array} The input number rounded to the given decimal places
			*/
			handlebars.registerHelper('round', function(no, dp) {
				return _.round(no, dp);
			});

			next();
		})
		// }}}
		// Compile the template {{{
		.then('output', function(next) {
			var template = handlebars.compile(this.template);
			next(null, template({
				items: data,
			}));
		})
		// }}}
		// Write the new file {{{
		.then(function(next) {
			fs.writeFile('brochure.html', this.output, next);
			next();
		})
		// }}}
		// End {{{
		.end(next);
		// }}}
};
