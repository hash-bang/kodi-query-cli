#!/usr/bin/env node

var _ = require('lodash');
var async = require('async-chainable');
var colors = require('colors');
var kodi = require('kodi-ws');
var program = require('commander');

program
	.version(require('./package.json').version)
	.usage('[paths...]')
	.option('-h, --host [address]', 'Sepecify the Kodi host')
	.option('-p, --port [number]', 'Specify the Kodi host port (default: 9090)', 9090)
	.option('-o, --output [renderer]', 'Set the output renderer. Values: json')
	.option('-v, --verbose', 'Be verbose')
	.option('--fields [csv]', 'Fields to request as a CSV')
	.option('--start [number]', 'Start at a given offset', parseInt)
	.option('--end [number]', 'End at a given offset', parseInt)
	.parse(process.argv);

async()
	// Sanity checks {{{
	.set('renderer', '')
	.then(function(next) {
		if (!program.host) return next('No host specified. Set with --host <address>');
		if (!program.port) return next('No port specified. Set with --port <number>');
		this.renderer = require(__dirname + '/renderers/' + program.output);
		next();
	})
	// }}}
	// Form the query {{{
	.then('query', function(next) {
		var q = {};
		if (!program.fields) {
			q.properties = ['title', 'year', 'file', 'fanart', 'plot', 'cast'];
		} else {
			q.properties = program.fields.split(/\s*,\s*/);
		}

		if (program.start || program.end) {
			q.limits = {};
			if (program.start) q.limits.start = program.start;
			if (program.end) q.limits.end = program.end;
		}
		next(null, q);
	})
	// }}}
	// Connect {{{
	.then('connection', function(next) {
		kodi(program.host, program.port)
			.then(connection => next(null, connection))
			.catch(err => next(err))
	})
	// }}}
	// Fetch items based on path {{{
	.parallel({
		movies: function(next) {
			this.connection.VideoLibrary.GetMovies(this.query)
				.then(data => next(null, data.movies.map(d => {
					delete d.label;
					d.type = 'movie';
					return d;
				})))
				.catch(next)
		},
		tv: function(next) {
			return next();
			this.connection.VideoLibrary.GetTVShows(this.query)
				.then(data => next(null, data.tv.map(d => {
					delete d.label;
					d.type = 'tv';
					return d;
				})))
				.catch(next)
		},
	})
	// }}}
	// Merge all data into one array {{{
	.then('data', function(next) {
		next(null, [].concat(this.movies, this.tv));
	})
	// }}}
	// Render the output {{{
	.then(function(next) {
		this.renderer(next, this.data, program);
	})
	// }}}
	// End {{{
	.end(function(err) {
		if (err) return console.log(colors.red('ERROR'), err.toString());
	});
	// }}}
