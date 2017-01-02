#!/usr/bin/env node

var _ = require('lodash');
var async = require('async-chainable');
var asyncFlush = require('async-chainable-flush');
var colors = require('colors');
var kodi = require('kodi-ws');
var fspath = require('path');
var program = require('commander');

program
	.version(require('./package.json').version)
	.usage('[paths...]')
	.option('-h, --host [address]', 'Sepecify the Kodi host')
	.option('-p, --port [number]', 'Specify the Kodi host port (default: 9090)', 9090)
	.option('-o, --output [renderer]', 'Set the output renderer. Values: json')
	.option('-v, --verbose', 'Be verbose')
	.option('--filter-by [field]', 'Filter output by a specified field (e.g. "basename" to filter only matching file basenames)')
	.option('--type [csv]', 'What types to query as a CSV (default: "movies,tv")', 'movies,tv')
	.option('--fields [csv]', 'Fields to request as a CSV (default: "title,year,file,thumbnail,plot,cast,rating")', 'title,year,file,thumbnail,plot,cast,rating')
	.option('--start [number]', 'Start at a given offset', parseInt)
	.option('--end [number]', 'End at a given offset', parseInt)
	.parse(process.argv);

async()
	.use(asyncFlush)
	// Sanity checks {{{
	.set('renderer', '')
	.then(function(next) {
		if (!program.host) return next('No host specified. Set with --host <address>');
		if (!program.port) return next('No port specified. Set with --port <number>');
		program.type = program.type.split(/\s*,\s*/).map(i => i.toLowerCase());
		this.renderer = require(__dirname + '/renderers/' + program.output);
		next();
	})
	// }}}
	// Form the query {{{
	.then('query', function(next) {
		var q = {};
		if (program.fields) q.properties = program.fields.split(/\s*,\s*/).map(i => i.toLowerCase());

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
			if (!_.includes(program.type, 'movies')) return next(null, []);
			this.connection.VideoLibrary.GetMovies(this.query)
				.then(data => next(null, data.movies.map(d => {
					delete d.label;
					d.type = 'movie';
					return d;
				})))
				.catch(next)
		},
		tv: function(next) {
			if (!_.includes(program.type, 'tv')) return next(null, []);
			this.connection.VideoLibrary.GetTVShows(this.query)
				.then(data => next(null, data.tvshows.map(d => {
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
	// Apply filter-by {{{
	.then('data', function(next) {
		if (!program.filterBy) return next(null, this.data);
		switch (program.filterBy) {
			case 'basename':
				var baseArgs = program.args.map(i => fspath.basename(i));
				return next(null, this.data.filter(i => _.includes(baseArgs, fspath.basename(i.file))));
			default:
				console.log('Unknown filter:', program.filterBy);
				return next(null, this.data);
		}
	})
	// }}}
	// Render the output {{{
	.then(function(next) {
		this.renderer(next, this.data, program);
	})
	// }}}
	// End {{{
	.flush()
	.end(function(err) {
		if (err) {
			console.log(colors.red('ERROR'), err.toString());
			process.exit(1);
		} else {
			process.exit(0);
		}
	});
	// }}}
